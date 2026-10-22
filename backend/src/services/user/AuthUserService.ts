import { compare } from "bcryptjs";
import { sign, type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";

interface Request {
  email: string;
  password: string;
}

export class AuthUserService {
  async execute({ email, password }: Request) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Mesma mensagem nos dois casos para não revelar quais e-mails existem
    const passwordMatch = user ? await compare(password, user.password) : false;

    if (!user || !passwordMatch) {
      throw new AppError("E-mail ou senha incorretos", 401);
    }

    const token = sign({ name: user.name, email: user.email }, env.JWT_SECRET, {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    });

    return { id: user.id, name: user.name, email: user.email, token };
  }
}
