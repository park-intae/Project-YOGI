import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.headers['x-session-id'];

    if (!sessionId || typeof sessionId !== 'string') {
      throw new UnauthorizedException('X-Session-ID header is missing or invalid.');
    }

    return true;
  }
}
