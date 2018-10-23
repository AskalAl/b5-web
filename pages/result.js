import { Component } from 'react'
import Page from '../components/Page'
import Resume from '../components/Resume'
import AddResults from '../components/AddResults'
import LoadFile from '../components/LoadFile'
const { parse } = require('url')
const { unpack } = require('jcb64')
const calculateScore = require('b5-calculate-score')
const getResult = require('b5-result-text')
const { getInfo } = require('b5-result-text')
const qs = require('querystring')
const FileSaver = require('file-saver')

export default class Result extends Component {
  constructor (props) {
    super(props)
    this.state = {
      b64: false,
      scores: false,
      resume: false,
      results: false,
      language: 'en',
      viewLanguage: 'en',
      chartWidth: 600
    }
    this.addResults = this.addResults.bind(this)
    this.getWidth = this.getWidth.bind(this)
    this.loadResults = this.loadResults.bind(this)
    this.saveResults = this.saveResults.bind(this)
    this.translateResume = this.translateResume.bind(this)
  }

  async componentDidMount () {
    const query = qs.parse(window.location.search.replace('?', ''))
    if (query.id) {
      const b64 = query.id
      const results = unpack(b64)
      const scores = calculateScore({ answers: results.answers })
      const info = getInfo()
      let language = this.state.language
      if (info.languages.includes(results.language)) {
        language = results.language
      }
      const resume = getResult({ scores: scores, lang: language })
      this.setState({
        b64: b64,
        scores: scores,
        resume: resume,
        language: results.language,
        viewLanguage: language,
        results: results
      })
    }
    document.addEventListener('DOMContentLoaded', this.getWidth(), false)
    window.addEventListener('resize', this.getWidth.bind(this))
  }

  getWidth () {
    const width = document.documentElement.clientWidth * 0.9
    this.setState({ chartWidth: width >= 500 ? width : 500 })
  }

  addResults (e) {
    e.preventDefault()
    let b64 = false
    const compressedDataField = document.getElementById('resultData')
    if (compressedDataField.value.startsWith('http')) {
      const url = parse(compressedDataField.value)
      const query = qs.parse(url.search.replace('?', ''))
      b64 = query.id
    } else {
      b64 = compressedDataField.value
    }
    const results = unpack(b64)
    const scores = calculateScore({ answers: results.answers })
    const info = getInfo()
    let language = this.state.language
    if (info.languages.includes(results.language)) {
      language = results.language
    }
    const resume = getResult({ scores: scores, lang: language })
    this.setState({
      b64: b64,
      scores: scores,
      resume: resume,
      language: results.language,
      viewLanguage: language,
      results: results
    })
    compressedDataField.value = ''
  }

  loadResults (e) {
    e.preventDefault()
    const reader = new window.FileReader()
    const files = e.target.files
    reader.onload = () => {
      const text = reader.result
      const results = JSON.parse(text)
      const scores = calculateScore({ answers: results.answers })
      const info = getInfo()
      let language = this.state.language
      if (info.languages.includes(results.language)) {
        language = results.language
      }
      const resume = getResult({ scores: scores, lang: language })
      this.setState({
        scores: scores,
        resume: resume,
        language: results.language,
        viewLanguage: language,
        results: results
      })
    }
    if (files.length === 1) {
      reader.readAsText(files[0])
    }
  }

  saveResults (e) {
    e.preventDefault()
    const results = this.state.results
    const file = new window.File([JSON.stringify(results, null, 2)], 'b5-results.json', { type: 'text/json;charset=utf-8' })
    FileSaver.saveAs(file)
  }

  translateResume (e) {
    e.preventDefault()
    const language = e.target.dataset.language
    const scores = this.state.scores
    const resume = getResult({ scores: scores, lang: language })
    this.setState({
      resume: resume,
      viewLanguage: language
    })
  }

  render () {
    return (
      <Page>
        <h1>Big Five Result</h1>
        {getInfo().languages.map((lang, index) => <button data-language={lang} onClick={this.translateResume} className={lang === this.state.viewLanguage ? 'isActive' : ''} key={index}>{lang}</button>)}
        {this.state.resume === false ? <AddResults addResults={this.addResults} /> : null}
        {this.state.resume === false ? <LoadFile handler={this.loadResults} buttonTitle={'Upload'} /> : null}
        {this.state.resume !== false
          ? <Resume data={this.state.resume} width={this.state.chartWidth} />
          : null}
        {this.state.resume !== false ? <button onClick={this.saveResults}>Save results</button> : null}
        <style jsx>
          {`
            h2 {
              color: red;
              font-size: 48px;
              text-align: center;
            }
            a, a:visited {
              color: white;
            }
            button {
              background-color: white;
              border-radius: 2px;
              color: black;
              padding: 15px 32px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              width: 200px;
              margin: 10px;
              cursor: pointer;
            }
            button:focus {
              outline:0;
            }
            button:active {
              outline: 0;
            }
            .isActive {
              background: yellow;
            }
          `}
        </style>
      </Page>
    )
  }
}
