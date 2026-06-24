import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
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
  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Get AI recommendations based on input_id' })
  @ApiResponse({ status: 200, description: 'Prompt generated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async getRecommendations(
    @Param('id') id: string,
  ) {
    return this.sessionsService.getRecommendationsPrompt(id);
  }
}
