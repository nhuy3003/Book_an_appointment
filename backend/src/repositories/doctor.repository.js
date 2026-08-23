const { Doctor, Specialty } = require("../routes/index.route");

const findByEmail = async (email) => {
    const doctor = await Doctor.findOne({ // findOne tim 1 thuoc tinh nao do
        where: { email}
    });
    return doctor;
};
const findDoctorById = async (id) => {

    const doctor =  await Doctor.findByPk(id, {
    attributes: [
        "id",
        "full_name",
        "email",
        "phone_number",
        "address",
        "specialty_id",
        "image_url",
        "experience_years",
        "price_per_appointment",
        "bio"
    ],
    include:[
        {
            model: Specialty,
            attributes: ["specialty_name"]
        }
    ],
});
return doctor;
};
const updatePassword = async (id, password) => {
    const doctor = await Doctor. update(
        { password },
        {
            where: {id}
        }
    );
    return doctor;
};
module.exports = {
    findByEmail,
    findDoctorById,
    updatePassword
};  

