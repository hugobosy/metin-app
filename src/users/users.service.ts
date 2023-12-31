process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { Body, Injectable, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserBalance, UserConfirmCode } from './users.entity';
import {
  GenerateCodeResponse,
  GetUsersResponse,
  UserResponse,
} from '../types/users';
import { AddUserDto } from './dto/AddUser.dto';
import { generateCode } from '../utils/generate-code';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private UserRepository: Repository<User>,
    @InjectRepository(UserConfirmCode)
    private UserConfirmRepository: Repository<UserConfirmCode>,
    @InjectRepository(UserBalance)
    private UserBalanceRepository: Repository<UserBalance>,
    private mailService: MailerService,
  ) {}

  async getUsers(): Promise<User[]> {
    return await this.UserRepository.find();
  }

  async getOneUser(id: string): Promise<User> {
    return await this.UserRepository.findOneByOrFail({ id });
  }

  async findOne(email: string): Promise<User | undefined> {
    return await this.UserRepository.findOneByOrFail({ email });
  }

  async addUser(user: AddUserDto): Promise<UserResponse> {
    const email = user.email;
    const locale = user.locale;
    const userEmail = await this.UserRepository.findOneBy({ email });
    if (userEmail?.email === user.email) {
      return { isSuccess: false, code: 502 };
    }
    await this.UserRepository.save(user);
    await this.UserBalanceRepository.save({ userID: user.id });
    const genCode = await this.generateCode(user);
    await this.sendEmail(email, genCode.code, locale);

    return { isSuccess: true, code: 201 };
  }

  async updateUserEmail(id: string, email: string): Promise<UserResponse> {
    await this.UserRepository.update(id, { email });
    return { isSuccess: true };
  }

  async updatePasswordUser(
    id: string,
    password: string,
  ): Promise<UserResponse> {
    await this.UserRepository.update(id, { password });
    return { isSuccess: true };
  }

  async removeUser(id: string): Promise<UserResponse> {
    await this.UserRepository.delete(id);
    return {
      isSuccess: true,
    };
  }

  async activateUser(code: string): Promise<UserResponse> {
    const isCode = await this.UserConfirmRepository.findOneBy({ code });
    if (isCode === null && isCode?.code !== code) {
      return { isSuccess: false, code: 502, message: 'Invalid activate code' };
    }
    await this.UserRepository.update(isCode.userID, { isActive: true });
    await this.UserConfirmRepository.delete(isCode.id);

    return { isSuccess: true, code: 201, message: 'User was activated' };
  }

  private async generateCode(user: AddUserDto): Promise<GenerateCodeResponse> {
    const code = generateCode();
    const genCode = {
      userID: user.id,
      code,
    };

    await this.UserConfirmRepository.save(genCode);

    return genCode;
  }

  private async sendEmail(
    @Query('toEmail') toEmail: string,
    code: string,
    locale: string,
  ): Promise<UserResponse> {
    await this.mailService.sendMail({
      to: toEmail,
      from: process.env.NODEMAILER_USER,
      subject: 'Weryfikacja konta w serwisie ksiegi-metina.pl',
      template: 'verification-email',
      context: {
        link: process.env.PROJECT_URL + `${locale}/activate/${code}`,
      },
    });

    return { isSuccess: true };
  }
}
