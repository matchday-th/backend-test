"use strict";

const Staff = use("App/Models/Staff");

class StaffController {
  /*  Staff API  */  
  async getStaff({ auth, response }) {

    const user = await auth.getUser()
    const staff = await Staff 
                  .query()
                  .where('provider_id' ,user.id )
                  .fetch()
    return response.send(staff);
  }

  async createStaff({ response, request, auth }) {
    const sp = await auth.getUser();
    const { username, password, level, fullname } = request.body;

    try {
      let st = new Staff();
      st.provider_id = sp.id;
      st.username = username;
      st.fullname = fullname
      st.password = password;
      st.level = level;

      await st.save();

      return response.send({ status: "success", st });
    } catch (err) {
      return response.send({ status: "fail", err });
    }
  }

  async editStaff({ response, request, params }) {
    const st = await Staff.find(params.id);
    const body = request.body;
    try {
      await st.merge(body);
      await st.save();
      return response.send({ status: "success", updated: st.id });
    } catch (err) {
      return response.send({ status: "fail", error: err.toString() });
    }
  }

  async deleteStaff({ response, params }) {   
    const staff = await Staff.find(params.id)
    try {
      await staff.delete()
      
      return response.send({status : 'Success'})
    } catch (err) {
        return response.send({status : 'Fail', err})
    }
  }
}

module.exports = StaffController;
