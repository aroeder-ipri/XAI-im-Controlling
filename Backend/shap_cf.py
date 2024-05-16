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
*MAX*Feature importance in JSON for the frontend
"""
# Berechne Gesamtwert der Feature Importance-Werte
total_importance = vals.sum()

# Berechne prozentuale Feature Importance
shap_importance = pd.DataFrame({
    'col_name': feature_names,
    'percentage_importance': ((vals / total_importance) * 100).round()
})
shap_importance.sort_values(by=['percentage_importance'], ascending=False, inplace=True)

shap_importance.to_json('shap_feature_importance.json', orient='records')

print("SHAP feature importance saved to shap_feature_importance.json")


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
y_query = y_test[1:2]
query_instances_rossmann = X_test[3:4] # Sales at 3231
y_query = y_test[3:4]
desired_percentage = 1.2
desired_range = [desired_percentage*y_query.values[0], 2*y_query.values[0]]
genetic_rossmann = exp_genetic_rossmann.generate_counterfactuals(query_instances_rossmann, total_CFs=1, 
                      desired_range=desired_range)

genetic_rossmann.visualize_as_dataframe(show_only_changes=False)

print("Counterfactual")
cf_instance = genetic_rossmann.cf_examples_list[0].final_cfs_df.transpose()
print(cf_instance)
print("Instanz aus den Testdaten")
query = query_instances_rossmann
print(query.transpose())

print("CF Unterschied")
instance = query.transpose().values
cf = cf_instance.values[:-1]
dif = cf - instance
dif = [x for xs in dif for x in xs]
dif = list(np.around(np.array(dif),2))
print(dif)

"""
Interpret counterfactual
"""

# Select 3 most differing values relatively

norm = [1,
        1,#query.values[0,1],
        1,#query.values[0,2],
        1,#query.values[0,3],
        1,#query.values[0,4],
        1,#query.values[0,5],
        1000, # not changeable
        1000, # not changeable
        1000, # not changeable
        1,
        1,
        1000, # not changeable
        1000, # not changeable
        1, 
        1,
        1,
        1,
        1,
        1,
        1,#query.values[0,19],
        1,#query.values[0,20],
        1,#query.values[0,21],     
        ]

#top_three = sorted(zip(dif, X_test.columns), key=abs, reverse=True)[:3]
#top_three = sorted(dif, key=abs, reverse=True)[:3]

zipped=list(zip(dif,X_test.columns))
top_three = sorted(zipped, key=lambda x: abs(x[0]), reverse=True)[:3]

#norm = [a+EPSILON for a in norm]
#normalize = zip([a/b for a,b in zip(dif,norm)],X_test.columns)
#top = sorted(zip([a/b for a,b in zip(dif,norm)],X_test.columns), reverse=True)#[:3]

response = "Counterfactual Erklärung: \n" + \
        "Der Umsatz liegt bei " + str(round(y_query.values[0],1)) + \
        ". Der Umsatz würde bei " + str(round(cf_instance.values[-1][0],1)) + \
        " liegen, wenn folgende Änderungen eintreten würden: \n"
       
features = X_test.columns # same as query columns

def case_statement(top_features, i, query):
    if top_features[i][1]== features[0]: # store
        result = "Änderung zu Store " + str(int(top_features[i][0]+query.values[0][0]))
    elif top_features[i][1]== features[1] and top_features[i][0] > 0: # customers
        result = str(int(round(top_features[i][0]))) + " mehr Kunden in dieser Woche"
    elif top_features[i][1]== features[1] and top_features[i][0] < 0: # customers
        result = str(int(round(-top_features[i][0]))) + " weniger Kunden in dieser Woche"
    elif top_features[i][1]== features[2] and top_features[i][0] > query.values[0][2]: # open
        result = 'Mehr Offen'
    elif top_features[i][1]== features[2] and top_features[i][0] < query.values[0][2]: # open
        result = 'Weniger Offen'
    elif top_features[i][1]== features[3] and top_features[i][0] > query.values[0][3]: # promo
        result = 'Mehr Promo'
    elif top_features[i][1]== features[3] and top_features[i][0] < query.values[0][3]: # promo
        result = 'Weniger Promo'
    elif top_features[i][1]== features[4] and top_features[i][0] > 0: # stateholiday
        result = str(int(round(top_features[i][0]))) + " gesetzliche(r) Feiertag(e) mehr in der Woche"
    elif top_features[i][1]== features[4] and top_features[i][0] < 0: # stateholiday
        result = str(int(round(-top_features[i][0]))) + " gesetzliche(r) Feiertag(e) mehr in der Woche"
    elif top_features[i][1]== features[5] and top_features[i][0] > 0: # schoolholiday
        result = str(int(round(top_features[i][0]))) + " schulfreie(r) Tag(e) mehr in dieser Woche"
    elif top_features[i][1]== features[5] and top_features[i][0] < 0: # schoolholiday
        result = str(int(round(-top_features[i][0]))) + " schulfreie(r) Tag(e) weniger in dieser Woche"
    elif top_features[i][1]== features[9]: # month
        result = "Änderung zu Monat " + str(int(top_features[i][0]+query.values[0][9]))
    elif top_features[i][1]== features[10]: # year
        result = "Änderung zu Jahr " + str(int(top_features[i][0]+query.values[0][10]))
    elif top_features[i][1]== features[13]: # store type
        result = "Änderung zu Store-Typ " + str(int(top_features[i][0]+query.values[0][13]))
    elif top_features[i][1]== features[14]: # assortment
        result = "Änderung zu Assortment-Typ " + str(int(top_features[i][0]+query.values[0][14]))
    elif top_features[i][1]== features[15] and top_features[i][0] == 1: # promo2
        result = 'Teilnahme an Promo2'
    elif top_features[i][1]== features[15] and top_features[i][0] == 0: # promo2
        result = 'keine Teilnahme an Promo2'
    elif top_features[i][1]== features[16]: # promointerval
        result = "Änderung zu Promointervall " + str(int(top_features[i][0]+query.values[0][16]))
    elif top_features[i][1]== features[19] and top_features[i][0] > 0: # holidays last week
        result = str(int(round(top_features[i][0]))) + " Ferien- oder Feiertag(e) mehr in der vorherigen Woche"
    elif top_features[i][1]== features[19] and top_features[i][0] < 0: # holidays last week
        result = str(int(round(-top_features[i][0]))) + " Ferien- oder Feiertag(e) weniger in der vorherigen Woche"
    elif top_features[i][1]== features[20] and top_features[i][0] > 0: # next week
        result = str(int(round(top_features[i][0]))) + " Ferien- oder Feiertag(e) mehr in der nächsten Woche"
    elif top_features[i][1]== features[20] and top_features[i][0] < 0: # next week
        result = str(int(round(-top_features[i][0]))) + " Ferien- oder Feiertag(e) weniger in der nächsten Woche"
    elif top_features[i][1]== features[21] and top_features[i][0] > 0: # this week
        result = str(int(round(top_features[i][0]))) + " Ferien- oder Feiertag(e) mehr in dieser Woche"
    elif top_features[i][1]== features[21] and top_features[i][0] < 0: # this week
        result = str(int(round(-top_features[i][0]))) + " Ferien- oder Feiertag(e) weniger in dieser Woche"
    elif top_features[i][1]== features[22]: # week of year
        result = "Änderung zu Woche " + str(int(top_features[i][0]+query.values[0][22]))
    else:
        result = 'Invalid case: ' + top_features[i][1]
    return result

print(response)
for i in range(0,3):
    print(case_statement(top_three, i, query))

"""
*MAX*Counterfactuals in JSON for the frontend
"""
# Interpretation der Counterfactuals
changes = [case_statement(top_three, i, query) for i in range(0, 3)]
response_values = {
    'sales_actual': round(y_query.values[0], 1),
    'sales_counterfactual': round(cf_instance.values[-1][0], 1),
    'changes': changes
}

# JSON-Datei mit den Werten der Counterfactuals speichern
with open('counterfactual_explanations.json', 'w') as json_file:
    json.dump(response_values, json_file)
