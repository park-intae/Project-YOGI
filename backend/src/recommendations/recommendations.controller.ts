import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionGuard } from '../common/guards/session.guard';
import { SessionId } from '../common/decorators/session-id.decorator';

@ApiTags('recommendations')
@Controller('api/v1')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post('recommendations')
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
    return this.recommendationsService.createSession(sessionId, createSessionDto);
  }

  @Get('recommendations/:input_id')
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Get AI recommendations based on input_id' })
  @ApiHeader({ name: 'X-Session-ID', description: 'Unique identifier for the user session', required: true })
  @ApiResponse({ status: 200, description: 'Prompt generated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async getRecommendations(
    @Param('input_id', new ParseUUIDPipe({ version: '4' })) inputId: string,
    @SessionId() sessionId: string,
    @Query('dev_mode') devMode?: string,
  ) {
    const isDevMode = devMode === 'true';
    return this.recommendationsService.getRecommendationsPrompt(inputId, sessionId, isDevMode);
  }

  @Get('recommendations/:input_id/more')
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Get additional AI recommendations' })
  @ApiHeader({ name: 'X-Session-ID', description: 'Unique identifier for the user session', required: true })
  @ApiResponse({ status: 200, description: 'Additional recommendations generated.' })
  async getMoreRecommendations(
    @Param('input_id', new ParseUUIDPipe({ version: '4' })) inputId: string,
    @SessionId() sessionId: string,
    @Query('excluded_ids') excludedIdsStr?: string,
    @Query('dev_mode') devMode?: string,
  ) {
    const isDevMode = devMode === 'true';
    const excludedIds = excludedIdsStr ? excludedIdsStr.split(',') : [];
    return this.recommendationsService.getMoreRecommendationsPrompt(inputId, sessionId, excludedIds, isDevMode);
  }
}
