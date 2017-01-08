/**
 * Created by euans on 29/12/2016.
 */

const ryle=require('../../');
const $http=require('http-as-promised');
const url='http://localhost:3000';
const opts={json:true, followRedirect:false};

var getJob=ryle({
  get _start(){return this.postJob},

  postJob(){
    return ryle.on($http.post(url+'/jobs',opts),this.checkPost)
  },

  checkPost(context, result){
    context.job=result[1];
    if (result[0].statusCode!==202) {
      throw new Error('Unexpected status code '+result[0].statusCode+' from POST');
    }
    if (!context.job.location) {
      throw new Error('No location included in POST response');
    }
    return this.getJob;
  },

  getJob(context){
    return ryle.on($http(url+context.job.location, opts), this.checkJob);
  },

  checkJob(context, result){
    if (result[0].statusCode!==303) {
      return ryle.onTimeout(250,this.getJob);
    }
    context.output=result[0].headers.location;
    return this.getResult;
  },

  getResult(context){
    return ryle.on($http(url+context.output, opts), this.gotResult);
  },

  gotResult(context, result){
    return ryle.exit(result[1]);
  }
});

module.exports=getJob;
