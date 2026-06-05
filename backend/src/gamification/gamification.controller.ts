import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { GamificationService } from './gamification.service';

@ApiTags('gamification')
@ApiBearerAuth()
@Controller()
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Weekly driver leaderboard' })
  @ResponseMessage('Leaderboard')
  leaderboard() {
    return this.gamification.leaderboard();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @Get('gamification/me')
  @ApiOperation({ summary: 'My gamification summary — points, weekly rank, commission reduction' })
  @ResponseMessage('Gamification')
  me(@CurrentUser('id') id: string) {
    return this.gamification.getDriverSummary(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @Get('gamification/achievements')
  @ApiOperation({ summary: 'My achievement badges (locked + unlocked)' })
  @ResponseMessage('Achievements')
  achievements(@CurrentUser('id') id: string) {
    return this.gamification.getAchievements(id);
  }
}
