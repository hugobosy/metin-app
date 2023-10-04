import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private userService: UsersService) {}

  async signOut() {
    return { isSuccess: true };
  }

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.userService.findOne(email);
    if (user?.password! == pass) {
      return { isSuccess: false };
    }

    const { password, ...result } = user;
    return result;
  }
}
