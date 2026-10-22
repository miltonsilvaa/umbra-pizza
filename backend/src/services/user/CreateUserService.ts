import { hash } from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";

interface Request {
  name: string;
  email: string;
  password: string;
}

export class CreateUserService {
  async execute({ name, email, password }: Request) {
    const alreadyExists = await prisma.user.findUnique({ where: { email } });

    if (alreadyExists) {
      throw new AppError("E-mail já cadastrado", 409);
    }

    const passwordHash = await hash(password, 10);

    return prisma.user.create({
      data: { name, email, password: passwordHash },
      select: { id: true, name: true, email: true },
    });
  }
}
