import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSourcesService } from 'src/data-sources/services';
import { DataSourceInflux } from 'src/data-sources/dto';
import { Repository } from 'typeorm';
import { CreateSessionDto, SessionDto } from './dto';
import { SessionEntity } from './entities';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private _sessionEntity: Repository<SessionEntity>,
    @Inject(forwardRef(() => DataSourcesService))
    private _dataSourcesService: DataSourcesService,
  ) {}

  /**
   * Creates a new session.
   * @param data The data for creating the session.
   * @returns The created session.
   * @throws NotImplementedException If the data source type of the session is not 'influx'.
   */
  createSession(data: CreateSessionDto): Promise<SessionEntity> {
    return this._sessionEntity.manager.transaction(async manager => {
      const repo = manager.getRepository(SessionEntity);
      const session = await repo.save({ ...data });

      return session;
    });
  }

  /**
   * Retrieves a session by its ID.
   * @param sessionId The ID of the session.
   * @returns The session.
   */
  async getSession(sessionId: string): Promise<SessionDto> {
    const result = await this._sessionEntity.findOne({
      where: { id: sessionId },
    });

    const dataSource = await this._dataSourcesService.getDataSourceById<DataSourceInflux>(
      result.dataSourceId,
      result.databaseType,
    );

    return { ...result, dataSource };
  }

  /**
   * Retrieves all sessions for a given tenant.
   * @returns The list of sessions.
   */
  getSessions(): Promise<SessionEntity[]> {
    return this._sessionEntity.find();
  }

  /**
   * Updates a session with the specified data.
   * @param sessionId The ID of the session to update.
   * @param data The partial data to update the session with.
   * @returns The updated session.
   */
  async updateSession(sessionId: string, data: Partial<CreateSessionDto>): Promise<SessionDto> {
    await this._sessionEntity.save({
      id: sessionId,

      ...data,
    });
    return this.getSession(sessionId);
  }

  /**
   * Deletes a session with the specified ID.
   * @param sessionId The ID of the session to delete.
   * @returns A boolean indicating whether the deletion was successful.
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    await this._sessionEntity.delete({ id: sessionId });
    return true;
  }
}
