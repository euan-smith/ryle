/**
 * Created by euans on 29/12/2016.
 *
 * Create an express REST service with a job which can take up to 2s
 */

var app=require('express')();
var tasks=[];
var results=[];

//POSTing to /jobs will return 202 (Accepted)
app.post('/jobs',(req,res)=>{
  //how long the job will take - random time up to 2 seconds
  tasks.push({completes: Date.now().valueOf()+Math.floor(Math.random()*2000)});
  res.status(202).send({location:"/tasks/"+(tasks.length-1)});
});

app.get('/tasks/:id',(req,res)=>{
  if (req.params.id>=tasks.length){
    res.sendStatus(404);
  } else {
    var task=tasks[req.params.id];
    if (!task.result && task.completes<Date.now().valueOf()){
      task.result=results.length;
      results.push("completed task "+task.result);
    }
    if (task.result){
      res.redirect(303, "/results/"+task.result);
    } else {
      res.send({status: "incomplete"});
    }
  }
});

app.get('/results/:id',(req,res)=>{
  if (req.params.id>=results.length || req.params.id<0){
    res.sendStatus(404);
  } else {
    res.send(results[req.params.id]);
  }
});

module.exports=app.listen(3000, ()=>{
    console.log('listening on port 3000!');
  });

