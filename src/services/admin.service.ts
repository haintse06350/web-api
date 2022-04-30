import { Op } from "sequelize";
import Admin from "../models/admin.model";
import Event from "../models/event.model";
import ActivityServices from "./activity.service";
import Post from "../models/post.model";
import UserPost from "../models/user-post.model";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { map } from "lodash";
import EventService from "./event.service";
import { NOTI_TYPE } from "../constants/notification";
import NotificationService from "./notification.service";
import PinServices from "./pin.services";
import ReportService from "./report.service";
import UserPostService from "./user-post.service";

const createAdmin = async () => {
  const admin = await Admin.findOne({ where: { name: "root" }, raw: true });

  if (admin) {
    return admin;
  }

  return Admin.create({
    email: "admin@heytutor.com",
    name: "root",
    password: "root",
    role: "superadmin",
    permissions: "all",
  });
};

const addCollaborator = async (ctx, payload) => {
  const { email, password, name, role, permission, address, phone, facebook } =
    payload;
  const userId = ctx?.user?.id;
  try {
    const adminInfo = Admin.findOne({
      where: {
        id: userId,
      },
      attributes: ["role", "name"],
      raw: true,
    });

    if (adminInfo.role === "superadmin" || adminInfo.role === "Admin") {
      const user = await Admin.findOne({
        where: { email },
        raw: true,
      });
      if (user === null) {
        const res = await Admin.create({
          email,
          password,
          name,
          role,
          permission,
          address,
          phone,
          facebook,
          updatedBy: userId,
          addBy: userId,
        });

        const log = await ActivityServices.create({
          userId,
          username: adminInfo.name,
          action: NOTI_TYPE.NewCollab,
          content: `adminId ${userId} add new collaborator ${name}`,
        });

        const id = await Admin.count();
        const payload = {
          userId: id,
          notificationType: NOTI_TYPE.NewCollab,
          fromUserId: userId,
          fromUsername: adminInfo.name,
        };
        await NotificationService.create(payload);

        return {
          log,
        };
      } else {
        return {
          message: "User already existed",
        };
      }
    } else if (adminInfo.role !== "superadmin" && adminInfo.role !== "Admin") {
      throw new BadRequestError({
        field: "ctx",
        message: "You dont have permission to update this information",
      });
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};

const updateCollaborator = async (ctx, payload) => {
  const { id, email, name, role, permission, address, phone, facebook } =
    payload;
  const userId = ctx?.user?.id;
  try {
    const adminInfo = Admin.findOne({
      where: {
        id: userId,
      },
      attributes: ["role", "name"],
      raw: true,
    });

    if (adminInfo.role === "superadmin" || adminInfo.role === "Admin") {
      const res = await Admin.update(
        {
          name,
          role,
          permission,
          address,
          phone,
          facebook,
          updatedBy: userId,
        },
        {
          where: {
            email,
          },
        }
      );
      const log = await ActivityServices.create({
        userId,
        username: adminInfo.name,
        action: NOTI_TYPE.UpdateCollab,
        content: `adminId ${userId} update collaboratorId ${id}`,
      });

      const payload = {
        userId: id,
        notificationType: NOTI_TYPE.UpdateCollab,
        fromUserId: userId,
        fromUsername: adminInfo.name,
      };
      await NotificationService.create(payload);
      return { status: 200 };
    } else if (adminInfo.role !== "superadmin" && adminInfo.role !== "Admin") {
      throw new BadRequestError({
        field: "ctx",
        message: "You dont have permission to update this information",
      });
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};

// const listAllCollaborator = async () => {
//   try {
//     const listCollaborator = await Admin.findAll({ raw: true });
//     return listCollaborator;
//   } catch (error) {
//     console.log(error);
//     return error;
//   }
// };

const listEventInXDays = async (nbFromDays, nbToDays) => {
  const currentDate = new Date(Date.now() - nbFromDays * 24 * 60 * 60 * 1000);
  const XDaysBefore = new Date(Date.now() - nbToDays * 24 * 60 * 60 * 1000);
  try {
    const list = await Event.findAll({
      where: {
        createdAt: {
          [Op.lt]: currentDate,
          [Op.gt]: XDaysBefore,
        },
      },
      raw: true,
    });
    return list;
  } catch (error) {
    return error;
  }
};

const listPostInXDays = async (nbFromDays, nbToDays) => {
  const currentDate = new Date(Date.now() - nbFromDays * 24 * 60 * 60 * 1000);
  const XDaysBefore = new Date(Date.now() - nbToDays * 24 * 60 * 60 * 1000);

  try {
    const list = await Post.findAll({
      where: {
        createdAt: {
          [Op.lt]: currentDate,
          [Op.gt]: XDaysBefore,
        },
      },
      raw: true,
    });

    return list;
  } catch (error) {
    return error;
  }
};

const listNewRegisterInXDays = async (nbFromDays, nbToDays) => {
  const currentDate = new Date(Date.now() - nbFromDays * 24 * 60 * 60 * 1000);
  const XDaysBefore = new Date(Date.now() - nbToDays * 24 * 60 * 60 * 1000);
  try {
    const list = await UserPost.findAll({
      where: {
        createdAt: {
          [Op.lt]: currentDate,
          [Op.gt]: XDaysBefore,
        },
      },
      raw: true,
    });

    let tempArray = [];
    for (const array of list) {
      if (array.registerId !== null && array.registerId.length !== 0) {
        if (tempArray.length === 0) {
          tempArray = array.registerId;
        } else if (tempArray.length !== 0) {
          tempArray = tempArray.concat(array.registerId);
        }
      }
    }

    const listNewRegisterInXDays = [...new Set(tempArray)];

    return listNewRegisterInXDays;
  } catch (error) {
    return error;
  }
};

const systemDetailsInXDays = async (ctx, nbOfDays) => {
  const twoTimeNbOfDays = nbOfDays * 2;
  const userId = ctx?.user?.id;

  try {
    const adminInfo = Admin.findOne({
      where: {
        id: userId,
      },
      attributes: ["role"],
      raw: true,
    });

    if (adminInfo.role === "superadmin" || adminInfo.role === "Admin") {
      const listEventsInXDays = await listEventInXDays(0, nbOfDays);
      const nbEventInXDays = listEventsInXDays.length;
      const listPostsInXDays = await listPostInXDays(0, nbOfDays);
      const nbOfNewPostInXDays = listPostsInXDays.length;
      const listAllNewRegisterInXDays = await listNewRegisterInXDays(
        0,
        nbOfDays
      );
      const nbOfNewRegisterInXDays = listAllNewRegisterInXDays.length;

      const listEventInPreviousXDays = await listEventInXDays(
        nbOfDays,
        twoTimeNbOfDays
      );
      const nbEventInPreviousXDays = listEventInPreviousXDays.length;
      const listPostsInPreviousXDays = await listPostInXDays(
        nbOfDays,
        twoTimeNbOfDays
      );
      const nbOfNewPostInPreviousXDays = listPostsInPreviousXDays.length;
      const listAllNewRegisterInPreviousXDays = await listNewRegisterInXDays(
        nbOfDays,
        twoTimeNbOfDays
      );
      const nbOfNewRegisterInPreviousXDays =
        listAllNewRegisterInPreviousXDays.length;

      let percentXdaysEventChange = nbEventInXDays * 100;
      if (nbEventInPreviousXDays !== 0) {
        percentXdaysEventChange =
          ((nbEventInXDays - nbEventInPreviousXDays) / nbEventInPreviousXDays) *
          100;
      }

      let percentXdaysPostChange = nbOfNewPostInXDays * 100;
      if (nbOfNewPostInPreviousXDays !== 0) {
        percentXdaysPostChange =
          ((nbOfNewPostInXDays - nbOfNewPostInPreviousXDays) /
            nbEventInPreviousXDays) *
          100;
      }

      let percentXdaysRegisterChange = nbOfNewRegisterInXDays * 100;
      if (nbOfNewRegisterInPreviousXDays !== 0) {
        percentXdaysRegisterChange =
          ((nbOfNewRegisterInXDays - nbOfNewRegisterInPreviousXDays) /
            nbOfNewRegisterInPreviousXDays) *
          100;
      }

      return {
        nbEventInXDays,
        percentXdaysEventChange,
        nbOfNewPostInXDays,
        percentXdaysPostChange,
        nbOfNewRegisterInXDays,
        percentXdaysRegisterChange,
      };
    } else if (adminInfo.role !== "superadmin" && adminInfo.role !== "Admin") {
      throw new BadRequestError({
        field: "ctx",
        message: "You dont have permission to access this information",
      });
    }
  } catch (error) {
    return error;
  }
};

const listCollaborator = async (ctx) => {
  const userId = ctx?.user?.id;
  try {
    const adminRole = Admin.findOne({
      where: {
        id: userId,
      },
      attributes: ["role"],
      raw: true,
    });

    if (adminRole.role === "superadmin" || adminRole.role === "Admin") {
      const listCollaborators = await Admin.findAll({
        where: {
          role: {
            [Op.like]: "ctv%",
          },
          // [Op.or]: [{ role: "ctv1" }, { role: "ctv2" }],
        },
        attributes: { exclude: ["password"] },
        raw: true,
      });

      const res = await Promise.all(
        map(listCollaborators, async (user) => {
          const nbOfPendingEvents =
            await EventService.countPendingEventOfCollaborator(user.id);

          const nbOfActiveEvents =
            await EventService.countActiveEventOfCollaborator(user.id);

          const nbOfUserInEvents =
            await EventService.countUserReportInEventOfCollaborator(user.id);

          const updateName = await Admin.findOne({
            where: {
              id: user.updatedBy,
            },
            attributes: ["name"],
            raw: true,
          });

          const collaboratorInfo = {
            userInfo: user,
            updateName: updateName.name,
            nbOfPendingEvents: nbOfPendingEvents.length,
            nbOfActiveEvents: nbOfActiveEvents.length,
            nbOfUserInEvents: nbOfUserInEvents,
          };

          return collaboratorInfo;
        })
      );

      return res;
    } else if (adminRole.role !== "superadmin" && adminRole.role !== "Admin") {
      throw new BadRequestError({
        field: "ctx",
        message: "You dont have permission to access this information",
      });
    }
  } catch (error) {
    console.log(error);

    throw new NotFoundError({
      field: "userId",
      message: "Collaborator is not found",
    });
  }
};

const listPostManage = async (ctx) => {
  const userId = ctx?.user?.id;
  try {
    const adminRole = Admin.findOne({
      where: {
        id: userId,
      },
      attributes: ["role"],
      raw: true,
    });

    if (adminRole.role === "superadmin" || adminRole.role === "Admin") {
      // const listPinPost = await PinServices.getListPinPost();
      const listReportedPost = await ReportService.listReportedPost();
      // const listNoRegisterPost = await UserPostService.getListPostNoRegister();

      return {
        // listPinPost,
        listReportedPost,
        // listNoRegisterPost,
      };
    } else if (adminRole.role !== "superadmin" && adminRole.role !== "Admin") {
      throw new BadRequestError({
        field: "ctx",
        message: "You dont have permission to access this information",
      });
    }
  } catch (error) {
    throw new NotFoundError({
      field: "postId",
      message: "Post is not found",
    });
  }
};

const collaboratorInfo = async (ctx, userId) => {
  const adminId = ctx?.user.id;
  try {
    const isAdmin = await Admin.findOne({
      where: {
        id: adminId,
      },
      attributes: ["role"],
      raw: true,
    });

    if (isAdmin.role === "Admin" || isAdmin.role === "superadmin") {
      const res = await Admin.findOne({
        where: {
          id: userId,
        },
        attributes: { exclude: ["password"] },
        raw: true,
      });

      const updatedName = await Admin.findOne({
        where: {
          id: res.addBy,
        },
        attributes: ["name"],
        raw: true,
      });

      return { ...res, adminAddedName: updatedName.name };
    } else if (isAdmin.role !== "Admin" && isAdmin.role !== "superadmin") {
      throw new BadRequestError({
        field: "adminId",
        message: "You dont have permission to access this information",
      });
    }
  } catch (error) {
    console.log(error);

    throw new NotFoundError({
      field: "adminId",
      message: "Admin is not found",
    });
  }
};

export default {
  createAdmin,
  addCollaborator,
  updateCollaborator,
  // listAllCollaborator,
  systemDetailsInXDays,
  listCollaborator,
  listPostManage,
  collaboratorInfo,
};
