import { Resolvers } from "../../../resolvers";
import {
  EmailSignUpMutationArgs,
  EmailSignUpResponse
} from "../../../types/graph";
import User from "../../../entities/User";
import createJWT from "../../../utils/createJWT";

const resolvers: Resolvers = {
  Mutation: {
    EmailSignUp: async (
      _,
      args: EmailSignUpMutationArgs
    ): Promise<EmailSignUpResponse> => {
      const { email } = args;
      try {
        //email로 이미 가입된 유저가 있는지 체크
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return {
            ok: false,
            error: "u already signed up!",
            token: null
          };
        }
        const newUser = await User.create({ ...args }).save();
        const token = createJWT(newUser.id);
        return {
          ok: true,
          error: null,
          token
        };
      } catch (error) {
        return {
          ok: false,
          error: error.message,
          token: null
        };
      }
    }
  }
};

export default resolvers;
