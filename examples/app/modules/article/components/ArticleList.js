/**
 * Created by dbuarque on 3/17/16.
 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { View, Text, ListView, StyleSheet } from 'react-native';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import WallList from '../modules/wall/components/WallList';
import Article from './../../../components/wallpost/Article';

import * as articleActions from '../modules/article/actions/articleActions';
import { articleSchema } from './../schemas/articleSchema';
import { is } from 'immutable';

@connect(
  function(state) {
    const { articleReducer } = state;
    return {
      articleReducer
    };
  },
  function(dispatch) {
    return {
      actions: bindActionCreators(articleActions, dispatch)
    }
  }
)
export default class ArticleList extends Component {

    constructor(props){
        super(props);

        this.state = {
            dataSource: new ListView.DataSource({ rowHasChanged: (r1, r2) => !is(r1,r2) })
        };
    }

    componentDidMount(){
      this.props.actions.loadArticles();
    }

    shouldComponentUpdate(nextProps){
        return !is(this.props.articleReducer.result,nextProps.articleReducer.result);
    }

    renderRow (articleObject) {

        const { actions } = this.props;

        return (
            <Article
                article = {articleObject}
                {...actions} />
        );
    }

    render () {

        return (
            <ListView
                dataSource={ this.state.dataSource.cloneWithRows(this.props.articleReducer.result.toArray())}
                renderRow={ this.renderRow.bind(this) }
            />
        );
    }

};
