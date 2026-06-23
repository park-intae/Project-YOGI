import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionGuard } from '../common/guards/session.guard';
import { SessionId } from '../common/decorators/session-id.decorator';

@ApiTags('sessions')
@Controller('api/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Save anonymous polymorphic session data' })
  @ApiHeader({ name: 'X-Session-ID', description: 'Unique identifier for the user session', required: true })
  @ApiResponse({ status: 201, description: 'Session created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Missing or invalid X-Session-ID.' })
  async createSession(
    @SessionId() sessionId: string,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return this.sessionsService.createSession(sessionId, createSessionDto);
  }
}
