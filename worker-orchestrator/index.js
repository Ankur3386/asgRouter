import {AutoScalingClient,SetDesiredCapacityCommand,DescribeAutoScalingInstancesCommand, TerminateInstanceInAutoScalingGroupCommand } from"@aws-sdk/client-auto-scaling"
import { EC2Client , DescribeInstancesCommand} from "@aws-sdk/client-ec2";
import dotenv from "dotenv"
import express from "express"
import { machine } from "os";
const app= express()
dotenv.config()
const client =new AutoScalingClient({region:"ap-south-1",
    credentials:{
   accessKeyId:process.env.AWS_ACCESS_KEY,
   secretAccessKey:process.env.AWS_ACCESS_SECRET
    }
})
const ec2Client =new EC2Client({region:"ap-south-1",
    credentials:{
   accessKeyId:process.env.AWS_ACCESS_KEY,
   secretAccessKey:process.env.AWS_ACCESS_SECRET
    }
})
//  what all machine array will store this of each instance
// type allMachine{
//     ip:string,
//     isUsed:boolean,
//     assignedProject?:string
// }
const allMachine=[] // bad  approach better way is using redis or cache
async function refreshInstance(){
const command= new DescribeAutoScalingInstancesCommand()
    const data= await client.send(command);
    //dont do it generally check which are used and push non used 
    allMachine.push(data.AutoScaling) //this does not return ip  it return instance id with other thingso need another 
    const ec2Instance= new DescribeInstancesCommand({
        InstanceIds:data.AutoScalingInstances.map(x=>x.InstanceId)
    })
   const ec2ClientData=await ec2Client.send(ec2Instance)
   console.log(JSON.stringify(ec2ClientData.Reservations[0].Instances[0].PublicDnsName)) //give public  DNS name
   // as we got  all public dns and name so now push al this in array  
}
refreshInstance()//calling manually once and then every 10 sec setInterval -->manually as so that i can see result now
setInterval(()=>{
 refreshInstance()   
},10*1000)

appendFile.get('/:projectId',async(req,res)=>{
const idleMachine= allMachine.find(x=>x.isUsed===false);
if(!idleMachine){
    //no machine available so scale infrastructure
    res.send("no machine availabe wait for some time")
}
idleMachine.isUsed=true;
//scale the infra so that extra machine available
 const capacity= new SetDesiredCapacityCommand({
    AutoScalingGroupName:"asg",
    DesiredCapacity:allMachine.length+1

})
 client.send(capacity);
res.send({
    ip:idleMachine.ip
})
})

//decrement the server when user left -->so its told by worker(machine) that the user has left so delete  me
app.post('/destroy',(req,res)=>{
    const machineId= req.body.machineId;
    const command= new TerminateInstanceInAutoScalingGroupCommand({
        InstanceId:machineId,
        ShouldDecrementDesiredCapacity:true //done so that we machine destroyed than we decrement desired capaciy so that asg does not make aa new one
    })
}) 
app.listen(4000)

// his way we can send desired capacity 
// const capacity= new SetDesiredCapacityCommand({
//     AutoScalingGroupName:"asg",
//     DesiredCapacity:1
// })
// const data = await client.send(capacity)
// console.log(data)