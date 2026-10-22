import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";

export class DetailUserService {
  async execute(user_id: string) {
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    return user;
  }
}
