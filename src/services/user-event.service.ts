import { BadRequestError } from "../utils/errors";
import UserEvent from "../models/user-event.model";

/**
 * To create a new term
 */
const list = async (payload) => {
  try {
    const res = await UserEvent.findAll({});
    return res;
  } catch (error) {
    throw new BadRequestError({
      field: "id",
      message: "Failed to create this item.",
    });
  }
};

const registerEvent = async (payload) => {
  const { userId, eventId, isSupporter, isRequestor } = payload;

  try {
    const res = await UserEvent.findOne({
      where: { userId, eventId },
    });

    if (res === null) {
      await UserEvent.create({
        userId: userId,
        eventId: eventId,
        isSupporter: isSupporter,
        isRequestor: isRequestor,
      });
    } else {
      await UserEvent.update(
        {
          isSupporter: isSupporter,
          isRequestor: isRequestor,
        },
        {
          where: { userId, eventId },
        }
      );
    }
  } catch (error) {
    throw new BadRequestError({
      field: "userId-eventId",
      message: "Failed to create this item.",
    });
  }
};

export default {
  list,
  registerEvent,
};
