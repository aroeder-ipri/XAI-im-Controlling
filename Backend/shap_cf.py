# -*- coding: utf-8 -*-

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import xgboost as xgb
import dice_ml
from dice_ml import Dice
import shap
#from sklearn.metrics import mean_squared_error as MSE

# Test performance
EPSILON =  1e-10 
def rmspe(y_true, y_pred):
    return (np.sqrt(np.mean(np.square((y_true - y_pred) / (y_true + EPSILON))))) * 100


"""
Set aggregation period: daily, weekly, monthly
"""
period = "weekly"
shap_nfeat = 0 # set to nr>0 to set 
explain_week_after = "2015-01-01"
store_type=1 # default

path = "train_extended_"+period+".csv"

if period=="daily":
    df = pd.read_csv("train_store.csv", sep=",", index_col = 'Date')
else:
    df = pd.read_csv(path, sep=";", decimal=",")
    
# Get relevant columns for model

relevant_cols = ['Store',
 #'DayOfWeek',
 #'Date',
 'Sales', #
 'Customers', #
 'Open', #
 'Promo', #
 'StateHoliday',
 'SchoolHoliday', #
 'AvgSalesPerCustomer',
 'SchoolHolidayRatio',
 'OpenDayRatio',
 'Month',
 #'DayOfYear',
 #'WeekOfYear',
 'Year',
 'SaturdaySalesRatio',
 'PromoDayRatio',
 #'RollingAvgSales_median_92_opt',
 #'RollingAvgSales_mean_92_opt',
 'StoreType',
 'Assortment',
 'Promo2',
 'PromoInterval',
 'shopsales_holiday',
 'shopsales_promo'
 #'YearWeek',
 #'IsHoliday'
 ]

if period == 'weekly':
    relevant_cols.extend(['Holidays_lastweek', 'Holidays_nextweek', 'Holidays_thisweek',
                         'WeekOfYear'])
    
if period == 'monthly':
    relevant_cols.extend(['Holidays_lastmonth', 'Holidays_nextmonth', 'Holidays_thismonth'])

if period in ['weekly', 'monthly']:
    df = df[relevant_cols]

if 'WeekOfYear' in df.columns:
    df['WeekOfYear'] = df['WeekOfYear'].astype(float).round()

"""
Train XGBoost model without parameter tuning
"""

# Split train and test
split_date = 2015
train = df.loc[df.Year < split_date].copy()
test = df.loc[df.Year >= split_date].copy()

X_train = train.drop(labels=['Sales'], axis=1)
y_train = train['Sales']
X_test = test.drop(labels=['Sales'], axis=1)
y_test = test['Sales']

# XGB Model
print("Train a XGBoost model")
model = xgb.XGBRegressor()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

#print("XGBoost model test RMSPE: ", rmspe(y_test.values, y_pred))
#plt.plot(y_test.values-y_pred)

"""
Calculate feature importance using SHAP
"""

# instatiate SHAP explainer
explainer = shap.Explainer(model)
predictors = [x for x in X_test.columns if x not in ['Sales']]
shap_values = explainer.shap_values(X_test[predictors])

# plots SHAP value summary
if shap_nfeat != 0:
    shap.summary_plot(shap_values, max_display=shap_nfeat, plot_type='bar')
else:
    shap.summary_plot(shap_values, plot_type='bar')
    
feature_names = X_test.columns
rf_resultX = pd.DataFrame(shap_values, columns = feature_names)
vals = np.abs(rf_resultX.values).mean(0)
shap_importance = pd.DataFrame(list(zip(feature_names, vals)),
                                  columns=['col_name','feature_importance_vals'])
shap_importance.sort_values(by=['feature_importance_vals'],
                               ascending=False, inplace=True)
shap_importance

"""
Generate counterfactuals with DiCE package
"""

continuous_features_rossmann = df.drop(['Sales'], axis=1).columns.tolist()

d_rossmann = dice_ml.Data(dataframe=df, continuous_features=continuous_features_rossmann, outcome_name='Sales')
m_rossmann = dice_ml.Model(model=model, backend="sklearn", model_type='regressor')

# Get explanations
exp_genetic_rossmann = Dice(d_rossmann, m_rossmann, method="genetic")

# Multiple queries can be given as input at once
query_instances_rossmann = X_test[1:2] # Sales at 4155
genetic_rossmann = exp_genetic_rossmann.generate_counterfactuals(query_instances_rossmann, total_CFs=1, 
                      desired_range=[4200, 10000])

genetic_rossmann.visualize_as_dataframe(show_only_changes=False)

print("Counterfactual")
print(genetic_rossmann.cf_examples_list[0].final_cfs_df.transpose())
print("Instanz aus den Testdaten")
print(X_test[1:2].transpose())
