import { Body, Controller, Get, Inject, Param, Put } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { BalanceDto } from './dto/balance.dto';

@Controller('balance')
export class BalanceController {
  constructor(@Inject(BalanceService) private balanceService: BalanceService) {}

  @Get('/')
  async getBalance(@Body('id') id: string) {
    return this.balanceService.getBalance(id);
  }

  @Put('/')
  async updateBalance(@Body() balance: BalanceDto) {
    console.log(balance);
    return this.balanceService.updateBalance(balance);
  }
}
