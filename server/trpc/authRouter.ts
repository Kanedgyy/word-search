import { createTRPCRouter, publicProcedure } from "./trpc";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    return session;
  }),
  
  signUp: publicProcedure
    .input(z.object({ 
      email: z.string().email(), 
      password: z.string().min(8), 
      name: z.string().min(1).max(50) 
    }))
    .mutation(async ({ input }) => {
      return await auth.api.signUpEmail({ 
        body: input, 
        headers: await headers() 
      });
    }),
  
  signIn: publicProcedure
    .input(z.object({ 
      email: z.string().email(), 
      password: z.string() 
    }))
    .mutation(async ({ input }) => {
      return await auth.api.signInEmail({ 
        body: input, 
        headers: await headers() 
      });
    }),
  
  signOut: publicProcedure.mutation(async () => {
    return await auth.api.signOut({ headers: await headers() });
  }),
});

export type AuthRouter = typeof authRouter;
