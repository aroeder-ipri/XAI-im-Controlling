#!/usr/bin/env python3

import numpy as np
import pandas as pd
import xgboost as xgb
import scipy.stats as st
import matplotlib.pyplot as plt
import shap
import argparse

from xgboost.sklearn import XGBRegressor
from sklearn.model_selection import train_test_split, RandomizedSearchCV

# to numerical
MAP_TO_NUMERIC = {'0':0, 'a':1, 'b':2, 'c':3, 'd':4}

def rmspe(y, yhat):
    return np.sqrt(np.mean((yhat / y-1) ** 2))

def rmspe_xg(yhat, y):
    y = np.expm1(y.get_label())
    yhat = np.expm1(yhat)
    return "rmspe", rmspe(y, yhat)

def preprocess_sales(sales_data):
    sales_data['Year'] = sales_data.index.year
    sales_data['Month'] = sales_data.index.month
    sales_data['Day'] = sales_data.index.day
    sales_data['WeekOfYear'] = sales_data.index.isocalendar().week

    # Closed stores and days which didn't have any sales won't be counted into the forecasts.
    if 'Sales' in sales_data.keys():
        sales_data = sales_data[(sales_data["Open"] != 0) & (sales_data['Sales'] != 0)]

    # replace NA with 0
    sales_data.fillna(0, inplace = True)
    return sales_data

def preprocess_stores(store_data):
    # fill NaN with a median value (skewed distribuion)
    store_data['CompetitionDistance'].fillna(store_data['CompetitionDistance'].median(), inplace = True)

    # replace non numeric store_data
    store_data['StateHoliday'].replace(MAP_TO_NUMERIC, inplace = True)
    store_data['Assortment'].replace(MAP_TO_NUMERIC, inplace = True)
    store_data['StoreType'].replace(MAP_TO_NUMERIC, inplace = True)
    store_data['StateHoliday'].replace(MAP_TO_NUMERIC, inplace = True)
    store_data.drop('PromoInterval', axis = 1, inplace = True)

    return store_data

def add_features(sales_data):
    # calculate sales per customer
    if 'Sales' in sales_data.keys():
        sales_data['SalePerCustomer'] = sales_data['Sales']/sales_data['Customers']

    # competition open time (in months)
    sales_data['CompetitionOpen'] = 12 * (sales_data['Year'] - sales_data['CompetitionOpenSinceYear']) + \
            (sales_data['Month'] - sales_data['CompetitionOpenSinceMonth'])
        
    # Promo open time
    sales_data['PromoOpen'] = 12 * (sales_data['Year'] - sales_data['Promo2SinceYear']) + \
            (sales_data['WeekOfYear'] - sales_data['Promo2SinceWeek']) / 4.0

    return sales_data

class SalesForecaster:
    def __init__(self, X, y, predictors, params=None) -> None:
        if params:
            # base parameters
            params = {
                    'booster': 'gbtree', 
                    'objective': 'reg:squarederror', # regression task
                    'subsample': 0.8, # 80% of data to grow trees and prevent overfitting
                    'colsample_bytree': 0.85, # 85% of features used
                    'eta': 0.1, 
                    'max_depth': 10, 
                    'seed': 42} # for reproducible results

        self.predictors = predictors

        test_train = train_test_split(X, y, 
                                        test_size = 0.3, # 30% for the evaluation set
                                        random_state = 42)
        self._X_train, self._X_test, self._y_train, self._y_test = test_train

        # XGB with xgboost library
        self.dtest = xgb.DMatrix(self._X_test[predictors], self._y_test)
        self.dtrain = xgb.DMatrix(self._X_train[predictors], self._y_train)

        self.watchlist = [(self.dtrain, 'train'), (self.dtest, 'test')]

        # XGB model variables
        self.model = None

    def optimize_params(self):
        print("")
        print("starting hyperparameter optimization..")
        # XGB with sklearn wrapper
        # the same parameters as for xgboost model
        params_sk = {   'max_depth': 10,
                        'n_estimators': 300, # the same as num_rounds in xgboost
                        'objective': 'reg:squarederror', 
                        # 'objective': 'reg:linear', 
                        'subsample': 0.8, 
                        'colsample_bytree': 0.85, 
                        'learning_rate': 0.1, 
                        'seed': 42
                        }

        skrg = XGBRegressor(**params_sk)
        skrg.fit(self._X_train, self._y_train)

        params_grid = {
            'learning_rate': st.uniform(0.01, 0.3),
            'max_depth': list(range(10, 20, 2)),
            'gamma': st.uniform(0, 10),
            'reg_alpha': st.expon(0, 50)}

        search_sk = RandomizedSearchCV(skrg, params_grid, cv = 5, verbose=10) # 5 fold cross validation
        search_sk.fit(self._X_train, self._y_train)

        # # best parameters
        print("")
        print("called grid search with parameters")
        print(search_sk.get_params())
        print("")
        print("found optimal hyper params")
        print(search_sk.best_params_)
        print(search_sk.best_score_)

        return search_sk.best_params_

    def train(self, hparams=None, path=None):
        print("")
        print("starting training..")
        if path:
            print("model will be save at:", path)

        # TODO do not hardcode from grid search
        # with new parameters
        hparams = {
            'booster': 'gbtree', 
            # 'objective': 'reg:linear', 
            'objective': 'reg:squarederror', 
            'subsample': 0.8, 
            'colsample_bytree': 0.85, 
            'eta': 0.044338624448041611, 
            'max_depth': 16, 
            'gamma': 0.80198330585415034,
            'reg_alpha': 23.008226565535971,
            'seed': 42}
        hparams.update({'gamma': 0.6755388900543347, 'learning_rate': 0.04475021678475888, 'max_depth': 16, 'reg_alpha': 37.09849892824301})

        self.model = xgb.train(hparams, self.dtrain, 300, evals = self.watchlist,
                                early_stopping_rounds = 50, custom_metric = rmspe_xg, verbose_eval = args.verbose)
        if path:
            json_config = self.model.save_model(path)
            print("model saved at", args.model_path)
        
        return json_config

    def predict(self, path):
        print("")
        print("starting inference..")
        print("got model path:", path)

        
        self.model = xgb.Booster()
        self.model.load_model(path)

        # prediction to validation data
        # yhat = model.predict(xgb.DMatrix(self._X_test[predictors]))
        # error = rmspe(self._X_test['Sales'].values, np.exp(yhat))
        # print('First validation yields RMSPE: {:.6f}'.format(error))

        # predictions to unseen data
        unseen = xgb.DMatrix(test_store[self.predictors])
        test_p = self.model.predict(unseen)
        forecasts = pd.DataFrame({  'Id': test['Id'],
                            'Sales': np.exp(test_p),
                            })
        
        return forecasts

parser = argparse.ArgumentParser("Tree Forecaster for Rossmann dataset with XAI interface")
parser.add_argument("cmd", type=str)
parser.add_argument("data_prefix", type=str)
parser.add_argument("--verbose", "-v", action='store_true', default=False)
parser.add_argument("--analysis", action='store_true', default=False)
parser.add_argument("--model-path", type=str, default="models/xgb_rossmann.json")
parser.add_argument("--explain-week-after", type=str, default="2015-08-01")
parser.add_argument("--explain-type", type=int, default=1)

args = parser.parse_args()

# importing train data to learn
print("preparing training data..")
train = pd.read_csv(args.data_prefix+"/train.csv",
                    parse_dates = True, low_memory = False, index_col = 'Date')

train = preprocess_sales(train)

# additional store data
store = pd.read_csv(args.data_prefix+"/store.csv",
                    low_memory = False)

if args.cmd == 'analyze':
    print("missing values")
    print(store.isnull().sum())
    print("")

    if args.verbose:
        print(train['SalePerCustomer'].describe())

        print("information about sales")
        print("In total: ", train.shape)

        print("additional information about the stores")
        print(store.head())
        print("In total: ", store.shape)
        print("")

# replace NA's by 0
store.fillna(0, inplace = True)

# by specifying inner join we make sure that only those observations 
# that are present in both train and store sets are merged together
train_store = pd.merge(train, store, how = 'inner', on = 'Store')
train_store = preprocess_stores(train_store)
train_store = add_features(train_store)

if args.cmd == 'analyze':
    print("desciptive Sales stats of each StoreType")
    print(train_store.groupby(['StoreType'])['Sales'].describe())
    print("")

    print("Sum of Sales and Customers for each StoreType")
    print(train_store.groupby(['StoreType'])[['Customers', 'Sales']].sum())
    print("")

    # stores which are opened on Sundays
    print("stores which are opened on Sundays")
    print(train_store[(train_store.Open == 1) & (train_store.DayOfWeek == 7)]['Store'].unique())
    print("")

# replace NA's by 0
train_store.fillna(0, inplace = True)

if args.cmd == 'analyze':
    # average PromoOpen time and CompetitionOpen time per store type
    print("average PromoOpen time and CompetitionOpen time per store type:")
    print(train_store.loc[:, ['StoreType', 'Sales', 'Customers', 'PromoOpen', 'CompetitionOpen']].groupby('StoreType').mean())

# PREPARING TEST SET
# 
# 
print("")
print("preparing test dataset..")

# to predict to
test = pd.read_csv(args.data_prefix+"/test.csv", 
                    parse_dates = True, low_memory = False, index_col = 'Date')
if args.cmd == 'analyze':
    # test: missing values?
    print("missing values")
    print(test.isnull().sum())

    print("stores not open")
    print(test[pd.isnull(test.Open)])

# replace NA's in Open variable by 1 
test.fillna(1, inplace = True)

# data prepprocessing
test = preprocess_sales(test)

# Joining test set with an additional store information.
test_store = pd.merge(test, store, how = 'inner', on = 'Store')

# add SalePerCustomer CompetitionOpen PromoOpen to test set
test_store = add_features(test_store)
test_store = preprocess_stores(test_store)

if args.cmd == 'analyze' or args.verbose:
    # take a look on the train and store again
    print("train_store data")
    print("In total: ", train_store.shape)
    print(train_store.head())

    # take a look on the test and store again
    print("test_store data")
    print("In total: ", test_store.shape)
    print(test_store.head())

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# MODEL TRAINING
#
#
# split into training and evaluation sets
# excluding Sales and Id columns
if args.cmd in ['opt', 'train', 'predict']:
    forecaster = SalesForecaster(
            X=train_store, 
            y=np.log(train_store['Sales']), 
            predictors=[x for x in train_store.columns if x not in ['Customers', 'Sales', 'SalePerCustomer']]
        )

    print("")
    print("split training data into:")
    print("training examples:", forecaster)
    print("test data:", forecaster)

# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# MODEL OPTIMIZATION/INFERENCE
#
#

if args.cmd == 'opt':
    params_opt = forecaster.optimize_params()


elif args.cmd == 'train':
    forecaster.train(path=args.model_path)


elif args.cmd == 'predict':
    store_type = args.explain_type

    forecasts = forecaster.predict(args.model_path)

    if args.verbose:
        print("unseen data:")
        print(forecasts.head())

    # build date index from args for explanation interval
    start_date = pd.to_datetime(args.explain_week_after)
    duration = pd.to_timedelta(6, unit='D')
    week_explain = pd.DatetimeIndex(pd.date_range(start=start_date, end=start_date+duration))

    test_store['Date'] = pd.DatetimeIndex([ f"{y}-{m}-{d}" for y, m, d in zip(test_store['Year'],test_store['Month'],test_store['Day'])])

    # get number of stores per StoreType
    store_type_idx = test_store[test_store['StoreType'] == store_type]

    # get SalesPerStore
    forecast_storetype_a = forecasts['Sales'].loc[forecasts['Id'].isin(store_type_idx['Id'])].groupby(['Date']).sum() / len(forecasts.loc[forecasts['Id'].isin(store_type_idx['Id'])].index)

    # instatiate SHAP explainer
    explainer = shap.Explainer(forecaster.model)
    shap_values = explainer(test_store.loc[test_store['Id'].isin(store_type_idx['Id'])].loc[test_store['Date'].isin(week_explain)][forecaster.predictors])
    
    # plot forecasts
    fig = plt.figure(figsize=(15, 15))
    ax = fig.subplot_mosaic([   ["forecast"   ],
                                ["shap"     ],
                                ["shap"     ]]
                            )
    ax["forecast"].plot(forecasts.loc[forecasts['Id'].isin(store_type_idx['Id'])].index.unique(), forecast_storetype_a, label=f"StoreType {store_type}")

    # plot lines and description
    ybound = ax['forecast'].get_ybound()
    ax["forecast"].vlines([week_explain[0], week_explain[-1]], [ybound[0]], [ybound[1]], colors='grey', ls='--', lw=1, label='SHAP value interval')
    ax["forecast"].legend()
    ax["forecast"].set_ylabel("Sales per Store")
    ax["forecast"].set_xlabel("Date")
    ax["forecast"].grid()

    # plots SHAP value summary
    plt.sca(ax['shap'])
    shap.summary_plot(shap_values, plot_type='bar')

    plt.show()