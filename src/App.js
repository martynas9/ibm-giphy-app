import React, { useEffect, useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.css';
import { config } from './config.js';
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.js';

const Logo = (props) => {

    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);

    return (
        <div className="logo"><span onClick={props.f_resetState} style={{color: randomColor}}>EXPRESS YOURSELF</span></div>
    );
}


const Searchbar = (props) => {

    const [text, setText] = useState('');

    const handleTextChange = (e) => {
        const re = new RegExp("^[a-zA-Z0-9 ]+$");
        const cutText = (e.target.value.length > 32 ? e.target.value.substring(0, 32) : e.target.value);
        if(cutText == '' || re.test(cutText)) {
            setText(cutText);
        }
    }

    const handleSearchKeyPress = (e) => {
        if(e.charCode == 13) {
            props.f_requestGiphyResult(text);
        }
    }

    return (
        <div className="searchbar input-group mb-3" >
            <input className="form-control" type="text" value={text} onChange={handleTextChange} onKeyPress={handleSearchKeyPress} placeholder="Search for an image..." />
            <div className="input-group-append">
                <button onClick={props.f_requestGiphyResult.bind(this, text)} className="btn btn-light" type="button" id="button-addon2"><i className="fas fa-search" /></button>
            </div>
        </div>
    )
}

const ResultsContainer = (props) => {
    const handleImageClick = (src) => {
        $('#previewImg').attr('src', src);
        $('#preview').modal('show');
    }

    const ResultImageDivs = () => { 


        return props.images.map((item, index) =>
            <div className="result col-6 col-sm-4 col-md-3" key={'res-'+index+'-'+item.id} style={{backgroundImage: `url(${item.images.downsized.url})`}} onClick={handleImageClick.bind(this, item.images.original.url)} />
        )
    };

    if(props.images) {
        //console.log(props.images)
        return (
            <div className="container mb-2" >
                <div className="row">
                    <ResultImageDivs />
                </div>
                <div>Loading...</div>
            </div>
        )
    } else {
        return('');
    }
};


const LoadMoreButton = (props) => {
    if(props.isVisible){
        return (
            <div className="d-flex justify-content-center">
                <button type="button" className="loadmore btn btn-outline-dark my-2" onClick={props.f_requestMoreGiphyResults}>Load More</button>
            </div>
        );
    } else {
        return('');
    }
}


const ImagePreview = (props) => {

    //const [tooltipText, setTooltipText] = useState('Copy to clipboard');

    useEffect(() => {
        $('#copyLink').tooltip({trigger: 'manual'});
        $('#copyLink').on('click', () => {
            navigator.clipboard.readText()
              .then(
                (clipText) => { 
                    const imgurl = $('#previewImg').prop('src');
                    if(imgurl != clipText) {
                        navigator.clipboard.writeText(imgurl)
                          .then(
                            () => {
                                $('#copyLink').tooltip('show');
                                setTimeout(() => $('#copyLink').tooltip('hide'), 2000);
                            },
                            () => {
                                console.log('Failed to write link to clipboard!')
                            }
                          );
                    } else {
                        console.log('Link is already copied!');
                    }
                },
                () => {
                    console.log('Failed to read clipboard text!');
                }
              );
        });
    }, []);

    return (
        <div className="modal fade bg-color-dark" id="preview" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="exampleModalCenterTitle">Preview</h5>
                        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <img id="previewImg" className="img-fluid"/>
                        <button id="copyLink" className="btn btn-sm btn-outline-secondary mt-3 material-tooltip-smaller" title='Copied to clipboard!' ><i className="fas fa-link"/> Copy link</button>
                    </div>
                </div>
            </div>
        </div>
    );
}



class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = this.getInitialState();
    }

    getInitialState = () => ({
        giphySearchString: false,
        giphyResult: false,
        giphyMaxResults: false,
        allowLoading: true,
        loading: false
    })

    resetState = () => {
        this.setState(this.getInitialState());
    }

    componentDidMount() {

        //this.requestGiphyResult('hello');
        window.addEventListener('scroll', this.checkIfScrolledDown);
    }

    checkIfScrolledDown = (e) => {
        //console.log('check if scrolled down');
        if($(window).scrollTop() + $(window).height() >= $(document).height()){
            if(this.state.allowLoading) {
                this.setState({allowLoading: false});
                setTimeout(() => {
                    this.setState({allowLoading: true});
                    this.checkIfScrolledDown();
                }, 1000);
                this.requestMoreGiphyResults();
            }
        }
    }

    requestGiphyResult = (searchString) => {
        if(!this.state.loading) {
            if(searchString != '') {
                let offset = 0;
                if(this.state.giphySearchString === searchString) {
                    offset = this.state.giphyResult.length-1;
                } else {
                    this.resetState();
                }
                const callurl = `https://api.giphy.com/v1/gifs/search?q=${searchString}&offset=${offset}&limit=12&api_key=${config.GIPHY_KEY}`;
                //console.log(callurl);
                this.setState({loading: true});
                //console.log('LOADING');
                fetch(callurl)
                .then((response) => (response.json()))
                .then((data) => {
                    //console.log('LOADED');
                    //console.log(data);
                    let updatedResult = (this.state.giphyResult ? this.state.giphyResult.concat(data.data) : data.data)
                    this.setState({giphySearchString: searchString, giphyResult: updatedResult, giphyMaxResults: data.pagination.total_count, loading: false});
                    if(offset > 0) {
                        this.checkIfScrolledDown();
                    }
                })
                .catch(err => {
                console.log('GIPHY API call error: ' + err);
                });
            }
        }
    }

    requestMoreGiphyResults = () => {
        if(this.state.giphySearchString && this.state.giphyResult && this.state.giphyMaxResults) {
            if(this.state.giphyResult.length < this.state.giphyMaxResults) {
                //console.log('request more results');
                this.requestGiphyResult(this.state.giphySearchString);
            }
        }
    }

    render() {
        return (
            <div id="app">
                <Logo f_resetState={this.resetState} />
                <div className="main container">
                    <Searchbar f_requestGiphyResult={this.requestGiphyResult} />
                    <ResultsContainer images={this.state.giphyResult} f_loadMore={this.requestGiphyResult.bind(this.state.giphySearchString)} loading={this.state.loading}/>
                    <LoadMoreButton  f_requestMoreGiphyResults={this.requestMoreGiphyResults} isVisible={(this.state.giphyResult ? (this.state.giphyResult.length < this.state.giphyMaxResults ? true : false) : false)} />
                    <ImagePreview />
                </div>
            </div>
        );
    }
}

export default App