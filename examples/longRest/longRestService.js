/**
 * Created by euans on 29/12/2016.
 *
 * Create an express REST service with a job which can take up to 2s
 */

const app=require('express')();
const ord=require('ord');

var tasks=[];
var results=[];

//POSTing to /jobs will return 202 (Accepted)
app.post('/jobs',(req,res)=>{
  //how long the job will take - random time up to 2 seconds
  tasks.push({completes: Date.now().valueOf()+Math.floor(Math.random()*2000)});
  res.status(202).send({location:"/tasks/"+(tasks.length-1)});
});

//GET a task in ptogress
app.get('/tasks/:id',(req,res)=>{
  //check that the task exists
  if (req.params.id<tasks.length && req.params.id>0){
    var task=tasks[req.params.id];
    //complete the task if it is due
    if (!task.result && task.completes<Date.now().valueOf()){
      task.result=results.length;
      results.push(task.result+ord(task.result)+" completed task");
    }
    //if completed then redirect otherwise send the status
    if (task.result){
      res.redirect(303, "/results/"+task.result);
    } else {
      res.send({status: "incomplete"});
    }
  } else {
    //the task does not exist
    res.sendStatus(404);
  }
});

//return a result if it exists
app.get('/results/:id',(req,res)=>{
  if (req.params.id<results.length && req.params.id>0){
    res.send(results[req.params.id]);
  } else {
    res.sendStatus(404);
  }
});

module.exports=app.listen(3000, ()=>{
    console.log('listening on port 3000!');
  });

