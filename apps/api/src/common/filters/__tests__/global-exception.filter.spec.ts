import { BadRequestException, NotFoundException, type ArgumentsHost, type HttpServer } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GlobalExceptionFilter } from '../global-exception.filter';

function buildHost(skipResponseEnvelope = false): {
  host: ArgumentsHost;
  statusMock: jest.Mock;
  jsonMock: jest.Mock;
} {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  const response = { status: statusMock } as unknown as Response;
  const request = { skipResponseEnvelope } as Request;

  // Mirrors what Nest actually hands a filter: router-proxy.js builds the ArgumentsHost with
  // `new ExecutionContextHost([req, res, next])`, so getHandler()/getClass() resolve to null —
  // unlike an interceptor's ExecutionContext, there is no route metadata available here.
  const host = {
    getHandler: jest.fn().mockReturnValue(null),
    getClass: jest.fn().mockReturnValue(null),
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(response),
      getRequest: jest.fn().mockReturnValue(request),
    }),
    getArgByIndex: jest.fn().mockReturnValue(response),
  } as unknown as ArgumentsHost;

  return { host, statusMock, jsonMock };
}

function buildApplicationRef(): HttpServer {
  return {
    isHeadersSent: jest.fn().mockReturnValue(false),
    reply: jest.fn((response: Response, body: unknown, statusCode: number) => {
      response.status(statusCode).json(body);
    }),
    end: jest.fn(),
  } as unknown as HttpServer;
}

describe('GlobalExceptionFilter', () => {
  it('reshapes a thrown NotFoundException to the envelope with data: null', () => {
    const filter = new GlobalExceptionFilter();
    const { host, statusMock, jsonMock } = buildHost();

    filter.catch(new NotFoundException('Project not found'), host);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Project not found',
      data: null,
    });
  });

  it('preserves a ValidationPipe-shaped array message instead of collapsing it', () => {
    const filter = new GlobalExceptionFilter();
    const { host, statusMock, jsonMock } = buildHost();

    filter.catch(new BadRequestException(['name should not be empty', 'email must be an email']), host);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 400,
      message: ['name should not be empty', 'email must be an email'],
      data: null,
    });
  });

  it('maps an unexpected non-HTTP error to 500 with a generic message, not the raw error text', () => {
    const filter = new GlobalExceptionFilter();
    const { host, statusMock, jsonMock } = buildHost();

    filter.catch(new Error('leaked db connection string details'), host);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
    });
  });

  it('lets the original exception response pass through unshaped when skipResponseEnvelope was stashed on the request', () => {
    const filter = new GlobalExceptionFilter(buildApplicationRef());
    const { host, statusMock, jsonMock } = buildHost(true);

    filter.catch(new NotFoundException('Project not found'), host);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Project not found',
      error: 'Not Found',
    });
  });
});
