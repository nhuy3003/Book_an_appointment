const BookableSlot = require("../models/bookable_slot.model");

const findSlotById = async (id) => {
    return BookableSlot.findByPk(id, {
        attributes: ["id", "doctor_id", "status"]
    });
};

const updateSlotStatus = async (slotId, status) => {

  return await BookableSlot.update(
    { status },
    { where: { id: slotId } }
  );

};

module.exports = {
    findSlotById,
    updateSlotStatus
};