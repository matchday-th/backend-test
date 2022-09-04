'use strict'
const Provider = use('App/Models/Provider')
const Plan = use('App/Models/PackageProvider')
const Package = use('App/Models/Package')

class PackageController {

  
    async CreatePackage({ response, request, auth }) {
      
        const { price, name , level } = request.body;
    
        try {
          let st = new Package();
         
          st.price = price 
          st.name = name
          st.level = level
    
          await st.save();
    
          return response.send({ status: "success", st });
        } catch (err) {
          return response.send({ status: "fail", err });
        }
      }

      async subPlan ({ response, request, auth }) {
        const { provider_id, package_id , start_date ,expire_date} = request.body;

        const planEx = await Plan.query()
                     .where("provider_id",provider_id)
                     .whereBetween("expire_date",[start_date,expire_date])
                     .fetch()

        const planST = await Plan.query()
                     .where("provider_id",provider_id)
                     .whereBetween("start_date",[start_date,expire_date])
                     .fetch()  

            
        let PE =  planEx.toJSON()
        let PS = planST.toJSON()

                    
                     if(PE.length < 1 && PS.length <1) {

        try {
            let st = new Plan();
           
            st.provider_id = provider_id 
            st.package_id = package_id
            st.start_date = start_date
            st.expire_date = expire_date

           // await st.save();
           
      
            return response.send({ status: "success", st ,planEx ,planST});
          } catch (err) {
            return response.send({ status: "fail", err });
          }
        
        }else{
            return response.send({ status: "fail", error: "already subscrib !" });   
        }

      }

      

}

module.exports = PackageController
