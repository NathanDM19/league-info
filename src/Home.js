import React, { Component } from 'react';
import axios from 'axios';

const KEY = "RGAPI-30a650bc-20a5-4619-8cb4-cccddf0c906b"
const URL = "https://oc1.api.riotgames.com"

export default class Home extends Component {
  constructor(props) {
    super(props)
    this.state = {
      query: ""
    }
    this.queryChange = this.queryChange.bind(this);
    this._submitSearch = this._submitSearch.bind(this);
  }

  queryChange(e) {
    this.setState({ query: e.target.value })
  }
  _submitSearch() {
    //https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/RiotSchmick?api_key=<key>
    axios.get(`https://oc1.api.riotgames.com/lol/summoner/v3/summoners/by-name/Cre?api_key=${KEY}`) .
      then(response => {
        console.log(response);
    })
  }

  render() {
    return (
      <div>
        <input onChange={this.queryChange} placeholder="Search for Summoner" type="text"/>
        <button onClick={this._submitSearch}>Search</button>
      </div>
    )
  }
}