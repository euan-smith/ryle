/**
 * Created by euans on 29/12/2016.
 */

const ryle=require('../../');
const $http=require('http-as-promised');

//the base url of the rest service
const url='http://localhost:3000';

//ensure the response is parsed as json and prevent the 303 causing an auto redirect
const jobOpts={json:true, followRedirect:false};

//the final get for the result object should just be the body
const resultOpts={resolve:'body'};

//declare the state machine
var getJob=ryle({
  get _start(){return this.postJob},

  //POST to the list of jobs
  postJob(){
    return ryle.on($http.post(url+'/jobs',jobOpts),this.checkJob)
  },

  //check the result of either the POST or GET
  checkJob(context, result){
    //store the result
    context.job=result;

    //if the response is a redirect then act on it and get the final result
    if (result[0].statusCode===303) {
      return this.getResult;
    }

    //otherwise if the body contains a property 'location' then get the job after a delay
    if (result[1] && result[1].location) {
      return ryle.onTimeout(250,this.getJob);
    }

    //otherwise the result was unexpected so throw an error
    throw new Error('Unexpected response');
  },

  //get the job object
  getJob(context){
    return ryle.on($http(url+context.job[1].location, jobOpts), this.checkJob);
  },

  //get the result
  getResult(context){
    //because the options specify to return a promise which resolves to the body
    //then this can just be returned as the result of the state machine
    return ryle.exit($http(url+context.job[0].headers.location, resultOpts));
  }
});

module.exports=getJob;
