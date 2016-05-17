'use strict';

import React, { View, Text } from 'react-native';

import { Provider } from 'react-redux';
import configureStore from './store/configureStore';
import ArticleList from './modules/article/components/ArticleList';

const store = configureStore({});

export default class Root extends React.Component{

  render() {
    return (
      <Provider store={store}>
          <ArticleList/>
      </Provider>
    );
  }
};
