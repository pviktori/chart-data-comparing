import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { Request } from 'express';
import { DataSourcesService } from './services/data-sources.service';
import { CreateDataSourceExtended, DatabaseType, DataSourceExtended } from './dto';

@Controller('data-sources')
export class DataSourcesController {
  constructor(private _dataSourcesService: DataSourcesService) {}

  @Get()
  getDataSources(@Req() req: Request): Promise<{
    [key in DatabaseType]?: DataSourceExtended[];
  }> {
    return this._dataSourcesService.getDateSources();
  }

  @Get(':type/:id')
  getDataSourceById(
    @Req() req: Request,
    @Param('type') type: DatabaseType,
    @Param('id') id: string,
  ): Promise<DataSourceExtended> {
    return this._dataSourcesService.getDataSourceById<DataSourceExtended>(id, type);
  }

  @Post(':type')
  createDataSource(
    @Req() req: Request,

    @Param('type') type: DatabaseType,
    @Body() body: CreateDataSourceExtended,
  ): Promise<DataSourceExtended> {
    return this._dataSourcesService.createDataSource<DataSourceExtended>(type, body);
  }

  @Post(':type/test-connection')
  testConnection(
    @Param('type') type: DatabaseType,
    @Body() body: CreateDataSourceExtended,
  ): Promise<boolean> {
    return this._dataSourcesService.testConnection(type, body);
  }

  @Put(':type/:id')
  updateDataSource(
    @Req() req: Request,

    @Param('id') id: string,
    @Param('type') type: DatabaseType,
    @Body() body: Partial<CreateDataSourceExtended>,
  ): Promise<DataSourceExtended> {
    return this._dataSourcesService.updateDataSource<DataSourceExtended>(id, type, body);
  }

  @Delete(':type/:id')
  deleteDataSource(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('type') type: DatabaseType,
  ): Promise<boolean> {
    return this._dataSourcesService.deleteDataSource<DataSourceExtended>(id, type);
  }
}
