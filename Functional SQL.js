

function groupBy(data,fns){
    if(!fns.length) return data;
    const group={};
    const fn=fns.shift();
    const groupType={};
    data.forEach(data=>{
        const key = fn(data);
        groupType[key] =typeof key;
        group[key]=group[key] || [];
        group[key].push(data);
    })
    return  Object.entries(group).map(([groupName,values])=>{
        if(groupType[groupName] === 'number'){
            groupName= Number(groupName);
        }
        return [groupName,groupBy(values,[...fns]) ]
    });

}
class Query{
    constructor(){
        this.selectFn=null;
        this.whereFns=[];
        this.andWhereFns=[];
        this.groupByFns=[];
        this.havingFns=[];
        this.orderByFn=null;
        this.data= [];
        this.called={}
    }
    select(fn){
        if(fn) this.selectFn=fn;
        if(this.called.SELECT)  throw new Error('Duplicate SELECT');
        this.called.SELECT=true;
        return this;
    }
    where(...fns){
        if(!this.whereFns.length) this.whereFns.push(...fns);
        else if(!this.andWhereFns.length) this.andWhereFns.push(...fns);
        else this.andWhereFns.push(...fns);
        return this;
    }
    from(data1,data2){
        if(this.called.FROM) throw new Error('Duplicate FROM');
        this.data= data1;
        if(data2){
            const join=[];
            for(let i=0;i<data1.length;++i){
                for(let j=0;j<data2.length;++j){
                    join.push([data1[i],data2[j]]);
                }
            }
            this.data=join;
        }
        this.called.FROM=true;
        return this;
    }
    groupBy(...fns){
        if(this.called.GROUPBY) throw new Error('Duplicate GROUPBY');
        if(fns) this.groupByFns=fns;
        this.called.GROUPBY=true;
        return this;
    }
    orderBy(fn){
        if(this.called.ORDERBY) throw new Error('Duplicate ORDERBY');
        if(fn) this.orderByFn=fn;
        this.called.ORDERBY=true;
        return this;
    }
    having(fn){
        if(fn) this.havingFns.push(fn);
        return this;
    }
    execute(){
        let excutableData=[...this.data];
 
        //WHERE
        if(this.whereFns &&  this.whereFns.length>0){
            excutableData= excutableData.filter( data=>{
                return this.whereFns.some( fn=> fn(data));
            });
        }
        //AND WHERE 
        if(this.andWhereFns &&  this.andWhereFns.length>0){
            excutableData= excutableData.filter( data=>{
                return this.andWhereFns.every( fn=> fn(data));
            });
        }
        //GROUP BY
        if( this.groupByFns &&  this.groupByFns.length>0){
          excutableData=groupBy(excutableData,this.groupByFns);
        }
       //HAVING 
       if(this.havingFns &&  this.havingFns.length>0){
        this.havingFns.forEach(fn =>{
            excutableData= excutableData.filter(fn);
        })}
        //SELECT 
        if(this.selectFn && typeof  this.selectFn ==='function'){
            excutableData = excutableData.map(this.selectFn);
        }
        //ORDER BY 
        if(this.orderByFn && typeof this.orderByFn  ==='function'){
                excutableData.sort(this.orderByFn);
        }
        return excutableData;
    }

}

module.exports=function query(){
    return  new Query();
}
