import { Resolvers } from "../../../types/resolvers";
import {
  UpdateRideStatusMutationArgs,
  UpdateRideStatusResponse
} from "../../../types/graph";
import User from "../../../entities/User";
import Ride from "../../../entities/Ride";
import Chat from "../../../entities/Chat";

const resolvers: Resolvers = {
  Mutation: {
    UpdateRideStatus: async (
      _,
      args: UpdateRideStatusMutationArgs,
      { req, pubSub }
    ): Promise<UpdateRideStatusResponse> => {
      const user: User = req.user;
      if (user.isDriving) {
        try {
          let ride: Ride | undefined;
          if (args.status === "ACCEPTED") {
            const ride = await Ride.findOne(
              {
                id: args.rideId,
                status: "REQUESTING"
              },
              { relations: ["passenger"] }
            );
            if (ride) {
              ride.driver = user;
              user.isTaken = true;
              user.save();
              const chat = await Chat.create({
                driver: user,
                passenger: ride.passenger
              }).save();
              ride.chat = chat;
              ride.save();
            }
          } else {
            ride = await Ride.findOne({
              id: args.rideId,
              driver: user
            });
          }
          if (ride) {
            ride.status = args.status;
            ride.save();
            pubSub.publish("rideUpdate", { RideStatusSubscription: ride });
            return {
              ok: true,
              error: null
            };
          } else {
            return {
              ok: false,
              error: "there is no ride"
            };
          }
        } catch (error) {
          return {
            ok: false,
            error: error.message
          };
        }
      } else {
        return {
          ok: false,
          error: "you are not a driver"
        };
      }
    }
  }
};

export default resolvers;
