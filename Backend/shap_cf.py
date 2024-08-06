# -*- coding: utf-8 -*-

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import xgboost as xgb
import dice_ml
from dice_ml import Dice
import shap
import random
#from multiprocessing import Process, Queue
from threading import Thread
import functools
random.seed(1)

'''
Set aggregation period: daily, weekly, monthly
'''
period = 'monthly'
shap_nfeat = 0 # set to nr>0 to set 
explain_week_after = '2015-01-01'
store_type=1 # default
store=470
month=4

path = 'train_extended_'+period+'.csv'

if period=='daily':
    df = pd.read_csv('train_store.csv', sep=',', index_col = 'Date')
else:
    df = pd.read_csv(path, sep=';', decimal=',')
    
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
    
    
'''
# Plot time series for stores

if period == 'monthly':
    df['Day'] = 1
    df['Date'] = pd.to_datetime(df[['Year', 'Month', 'Day']])

plt.plot('Date', 'Sales', data = df.loc[df['Store']==470])
plt.scatter(datetime.strptime('2015-04-01', '%Y-%m-%d'), y_pred[470-1], c='red')

plt.plot('Date', 'Sales', data = df.loc[df['Store']==1097])
plt.scatter(datetime.strptime('2015-04-01', '%Y-%m-%d'), y_pred[1097-1], c='red')

df = df.drop(['Day','Date'], axis=1)
'''


'''
Train XGBoost model without parameter tuning
'''

# Split train and test
split_date = 2015

# year not 2015 and month not greater 4
train = df.loc[(df.Year != split_date) | (df.Month < month)].copy()
test = df.loc[(df.Year >= split_date) & (df.Month == month)].copy()

X_train = train.drop(labels=['Sales'], axis=1)
y_train = train['Sales']
X_test = test.drop(labels=['Sales'], axis=1)
y_test = test['Sales']

# XGB Model
print('Train a XGBoost model')
model = xgb.XGBRegressor()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)


'''
Calculate feature importance using SHAP
'''

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

'''
*MAX*Feature importance in JSON for the frontend
'''
# Berechne Gesamtwert der Feature Importance-Werte
total_importance = vals.sum()

# Berechne prozentuale Feature Importance
shap_importance = pd.DataFrame({
    'col_name': feature_names,
    'percentage_importance': ((vals / total_importance) * 100).round()
})
shap_importance.sort_values(by=['percentage_importance'], ascending=False, inplace=True)

shap_importance.to_json('shap_feature_importance.json', orient='records')

print('SHAP feature importance saved to shap_feature_importance.json')

'''
Define functions for CF
'''

def timeout(timeout):
    def deco(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            res = [Exception('function [%s] timeout [%s seconds] exceeded!' % (func.__name__, timeout))]
            def newFunc():
                try:
                    res[0] = func(*args, **kwargs)
                except Exception as e:
                    res[0] = e
            t = Thread(target=newFunc)
            t.daemon = True
            try:
                t.start()
                t.join(timeout)
            except Exception as je:
                print ('error starting thread')
                raise je
            ret = res[0]
            if isinstance(ret, BaseException):
                raise ret
            return ret
        return wrapper
    return deco

@timeout(60)
def generate_cf(query, desired_range, features_vary, permitted_range):
    cf = exp_genetic_rossmann.generate_counterfactuals(query, total_CFs=1, 
                      desired_range=desired_range,
                      features_to_vary = features_vary,
                      permitted_range = permitted_range)
    return cf


def get_cf(store, X_test, y_pred, desired_range, features_vary, permitted_range):
    query_instances_rossmann = X_test[store-1:store]
    y_query = y_pred[store-1:store]
    query = query_instances_rossmann
    #permitted_range = {'Month': [max(1,query['Month'].values[0]-1),min(12,query['Month'].values[0]+1)],
    #                   'Holidays_lastmonth':[max(0,query['Holidays_lastmonth'].values[0]-5),min(28,query['Holidays_lastmonth'].values[0]+5)],
    #                   'Holidays_nextmonth':[max(0,query['Holidays_nextmonth'].values[0]-5),min(28,query['Holidays_nextmonth'].values[0]+5)],
    #                   'Holidays_thismonth':[max(0,query['Holidays_thismonth'].values[0]-5),min(28,query['Holidays_thismonth'].values[0]+5)]}
    #desired_range = [desired_percentage*y_query.values[0], 5*y_query.values[0]]
    #desired_range = [1.05*y_query[0], 1.1*y_query[0]]
    features_vary = features_vary
    
    try:
        genetic_rossmann = generate_cf(query, desired_range, features_vary, permitted_range)

    except Exception:
        raise ValueError
        #print('Kein Counterfactual gefunden. Versuchen Sie es mit einem anderen Zielbereich.')
        
    return genetic_rossmann, query, y_query
 
    
def interpret_cf(genetic_rossmann, query, y_query):
    cf_instance = genetic_rossmann.cf_examples_list[0].final_cfs_df.transpose()
    original_instance = query.transpose().values
    cf = cf_instance.values[:-1]
    dif = cf - original_instance
    dif = [x for xs in dif for x in xs]
    dif = list(np.around(np.array(dif),2))

    # top three differences
    zipped=list(zip(dif,query.columns))
    top_three = sorted(zipped, key=lambda x: abs(x[0]), reverse=True)[:3]
    
    '''
    response = 'Counterfactual Erklärung: \n' + \
            'Der Umsatz wird auf ' + str(round(y_query[0],1)) + ' geschätzt. '\
            'Der Umsatz würde bei ' + str(round(cf_instance.values[-1][0],1)) + \
            '€ liegen, wenn folgende Änderungen eintreten würden: \n'
          
    print(response)
    for i in range(0,3):
        print(case_statement(top_three, i, query))
    '''
        
    changes = [case_statement(top_three, i, query) for i in range(0, 3)]
    
    response_values = {
        'sales_actual': round(y_query[0], 1),
        'sales_counterfactual': round(cf_instance.values[-1][0], 1),
        'changes': changes
    }
    
    return response_values, changes


def case_statement(top_features, i, query):
    features = query.columns
    if top_features[i][1]== features[1] and top_features[i][0] > 0: # customers
        result = str(int(round(top_features[i][0]))) + ' customers too few in April'
    elif top_features[i][1]== features[1] and top_features[i][0] < 0: # customers
        result = str(int(round(-top_features[i][0]))) + ' customers too many in April'
    elif top_features[i][1]== features[2] and top_features[i][0] > query.values[0][2]: # open
        result = 'too few days opened in April'
    elif top_features[i][1]== features[2] and top_features[i][0] < query.values[0][2]: # open
        result = 'too many days opened in April'
    elif top_features[i][1]== features[3] and top_features[i][0] > query.values[0][3]: # promo
        result = 'too few daily promotions in April'
    elif top_features[i][1]== features[3] and top_features[i][0] < query.values[0][3]: # promo
        result = 'too many daily promotions in April'
    elif top_features[i][1]== features[4] and top_features[i][0] > 0: # stateholiday
        result = str(int(round(top_features[i][0]))) + ' state holidays too few in April'
    elif top_features[i][1]== features[4] and top_features[i][0] < 0: # stateholiday
        result = str(int(round(-top_features[i][0]))) + ' state holidays too many in April'
    elif top_features[i][1]== features[5] and top_features[i][0] > 0: # schoolholiday
        result = str(int(round(top_features[i][0]*30))) + ' school holidays too few in April'
    elif top_features[i][1]== features[5] and top_features[i][0] < 0: # schoolholiday
        result = str(int(round(-top_features[i][0]*30))) + ' school holidays too few in April'
    elif top_features[i][1]== features[6] and top_features[i][0] < 0: # schoolholiday
        result = 'average sales per customer ' + str(int(round(-top_features[i][0]))) + '€ too high in April'
    elif top_features[i][1]== features[6] and top_features[i][0] > 0: # schoolholiday
        result = 'average sales per customer ' + str(int(round(top_features[i][0]))) + '€ too low in April'
    elif top_features[i][1]== features[9]: # month
        result = 'month is April instead of ' + str(int(top_features[i][0]+query.values[0][9]))
    elif top_features[i][1]== features[13]: # store type
        result = 'store type is ' + str(int(query.values[0][13])) + ' instead of ' + str(int(top_features[i][0]+query.values[0][13]))
    elif top_features[i][1]== features[14]: # assortment
        result = 'assortment type is ' + str(int(query.values[0][14])) + ' instead of ' + str(int(top_features[i][0]+query.values[0][14]))
    elif top_features[i][1]== features[15] and top_features[i][0] == 1: # promo2
        result = 'store does not participate in ongoing promotion'
    elif top_features[i][1]== features[15] and top_features[i][0] == -1: # promo2
        result = 'store participates in ongoing promotion'
    elif top_features[i][1]== features[16]: # promointerval
        result = 'ongoing promotion interval is ' + str(int(query.values[0][16])) + ' instead of ' + str(int(top_features[i][0]+query.values[0][16]))
    elif top_features[i][1]== features[19] and top_features[i][0] > 0: # holidays last week
        result = str(int(round(top_features[i][0]))) + ' school or state holidays too few in March'
    elif top_features[i][1]== features[19] and top_features[i][0] < 0: # holidays last week
        result = str(int(round(-top_features[i][0]))) + ' school or state holidays too many in March'
    elif top_features[i][1]== features[20] and top_features[i][0] > 0: # next week
        result = str(int(round(top_features[i][0]))) + ' school or state holidays too few in May'
    elif top_features[i][1]== features[20] and top_features[i][0] < 0: # next week
        result = str(int(round(-top_features[i][0]))) + ' school or state holidays too many in May'
    elif top_features[i][1]== features[21] and top_features[i][0] > 0: # this week
        result = str(int(round(top_features[i][0]))) + ' school or state holidays too few in April'
    elif top_features[i][1]== features[21] and top_features[i][0] < 0: # this week
        result = str(int(round(-top_features[i][0]))) + ' school or state holidays too many in April'
    else:
        result = 'error for feature: ' + top_features[i][1]
    return result


# store types
# 1 - city center, 2 - commercial area, 3 - suburbs, 4 - rural
# assortment types
# 1 - basic, 2 - extra, 3 - extended

'''
Generate CF
'''

# initiate
continuous_features_rossmann = df.drop(['Sales'], axis=1).columns.tolist()  
d_rossmann = dice_ml.Data(dataframe=df, continuous_features=continuous_features_rossmann, outcome_name='Sales')
m_rossmann = dice_ml.Model(model=model, backend='sklearn', model_type='regressor')
exp_genetic_rossmann = Dice(d_rossmann, m_rossmann, method='genetic')

# set features to vary
features_vary = continuous_features_rossmann.copy()
features_vary.remove('Store')
features_vary.remove('Year')
features_vary.remove('SchoolHolidayRatio')
features_vary.remove('OpenDayRatio')


# Determine range of CFs

percentages = [0.9,0.92,0.94,0.96,0.98,1.0,1.02,1.04,1.06,1.08,1.1,1.12,1.14,1.16,1.18,1.2]
#percentages = [0.9,0.93,0.96,0.99,1.02,1.05,1.08,1.11,1.14,1.17,1.2]
#percentages = [0.9,0.95,1.0,1.05,1.1,1.15,1.2]

save_cfs = pd.DataFrame(columns=['Store', 'Sales', 'Sales_CF', 'Percentage1', 'Percentage2', 'CF', 'Explanation'])

# Multiple queries can be given as input at once
query_instances_rossmann = X_test[store-1:store] 
y_query = y_pred[store-1:store]
query = query_instances_rossmann
#permitted_range = {"Customers": [query["Customers"],query[]]
 #                  "Month": [max(1,query["Month"].values[0]-1),min(11,query["Month"].values[0]+1)],
  #                 "Holidays_lastmonth":[max(0,query["Holidays_lastmonth"].values[0]-5),min(28,query["Holidays_lastmonth"].values[0]+5)],
   #                "Holidays_nextmonth":[max(0,query["Holidays_nextmonth"].values[0]-5),min(28,query["Holidays_nextmonth"].values[0]+5)],
    #               "Holidays_thismonth":[max(0,query["Holidays_thismonth"].values[0]-5),min(28,query["Holidays_thismonth"].values[0]+5)]}

for k in range(1,len(percentages)):
    if percentages[k] <= 1.0:
        permitted_range = {"Customers": [0,query["Customers"].values[0]],
                           "Month": [max(1,query["Month"].values[0]-1),min(11,query["Month"].values[0]+1)],
                           "Holidays_lastmonth":[max(0,query["Holidays_lastmonth"].values[0]-5),min(28,query["Holidays_lastmonth"].values[0]+5)],
                           "Holidays_nextmonth":[max(0,query["Holidays_nextmonth"].values[0]-5),min(28,query["Holidays_nextmonth"].values[0]+5)],
                           "Holidays_thismonth":[max(0,query["Holidays_thismonth"].values[0]-5),min(28,query["Holidays_thismonth"].values[0]+5)]}

    else:
        permitted_range = {"Customers": [query["Customers"].values[0],3*query["Customers"].values[0]],
                           "Month": [max(1,query["Month"].values[0]-1),min(11,query["Month"].values[0]+1)],
                           "Holidays_lastmonth":[max(0,query["Holidays_lastmonth"].values[0]-5),min(28,query["Holidays_lastmonth"].values[0]+5)],
                           "Holidays_nextmonth":[max(0,query["Holidays_nextmonth"].values[0]-5),min(28,query["Holidays_nextmonth"].values[0]+5)],
                           "Holidays_thismonth":[max(0,query["Holidays_thismonth"].values[0]-5),min(28,query["Holidays_thismonth"].values[0]+5)]}

    
    
    desired_range = [percentages[k-1]*y_query[0], percentages[k]*y_query[0]]
    
    try:
        genetic_rossmann, query, y_query = get_cf(store, X_test, y_pred, desired_range, features_vary, permitted_range)
        response_values, changes = interpret_cf(genetic_rossmann, query, y_query)
        
        # cf
        cf_instance = genetic_rossmann.cf_examples_list[0].final_cfs_df.transpose()
         # original
        instance = query.transpose().values
        cf = cf_instance.values[:-1]
        dif = cf - instance
        dif = [x for xs in dif for x in xs]
        dif = list(np.around(np.array(dif),2))

        # top three differences
        zipped = list(zip(dif,X_test.columns))
        top_three = sorted(zipped, key=lambda x: abs(x[0]), reverse=True)[:3]

        save_cfs.loc[len(save_cfs.index)] = [store, round(y_query[0],1), round(cf_instance.values[-1][0],1), percentages[k-1], percentages[k], str(top_three), str(changes)] 
        
    except ValueError:
        # append no CF
        save_cfs.loc[len(save_cfs.index)] = [store, round(y_query[0],1), None, percentages[k-1], percentages[k], None, None] 
        print('No counterfactual found.')
        continue

save_cfs.to_csv("C:/Users/laram/Downloads/cf_470_2er_.csv", decimal=".")


desired_range=[10000,12000]
try:
    genetic_rossmann, query, y_query = get_cf(store, X_test, y_pred, desired_range, features_vary)
    response_values, changes = interpret_cf(genetic_rossmann, query, y_query)
except ValueError:
    print('No counterfactual found. Try another target range.')


'''
*MAX*Counterfactuals in JSON for the frontend
'''
# Interpretation der Counterfactuals
'''
changes = [case_statement(top_three, i, query) for i in range(0, 3)]
response_values = {
    'sales_actual': round(y_query.values[0], 1),
    'sales_counterfactual': round(cf_instance.values[-1][0], 1),
    'changes': changes
}


# JSON-Datei mit den Werten der Counterfactuals speichern
with open('counterfactual_explanations.json', 'w') as json_file:
    json.dump(response_values, json_file)
'''

'''
JSON for the store description

store_descriptions = [
    {
        'Store': 470,
        'Store Type': 'a',
        'Assortment': 'extended',
        'Competition Distance': 50,
        #'Start of Promotion': 'no promotion'
    },
    {
        'store': 1097,
        'Store Type': 'b',
        'Assortment': 'extra',
        'Competition Distance': 720,
        #'Start of Promotion': 'no promotion'
    }
]

with open('store_descriptions.json', 'w') as json_file:
    json.dump(store_descriptions, json_file)

'''