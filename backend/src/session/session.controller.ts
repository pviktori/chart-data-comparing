import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateSessionDto } from './dto';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private _sessionService: SessionService) {}

  @Get('')
  getSessions() {
    return this._sessionService.getSessions();
  }

  @Post()
  startSession(@Body() body: CreateSessionDto) {
    return this._sessionService.createSession(body);
  }

  @Get(':sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    return this._sessionService.getSession(sessionId);
  }

  @Put(':sessionId')
  updateSession(@Param('sessionId') sessionId: string, @Body() body: Partial<CreateSessionDto>) {
    return this._sessionService.updateSession(sessionId, body);
  }

  @Delete(':sessionId')
  deleteSession(@Param('sessionId') sessionId: string) {
    return this._sessionService.deleteSession(sessionId);
  }
}
