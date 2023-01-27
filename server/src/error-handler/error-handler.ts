import * as util from 'util';
import {Response} from 'express';
import {isCelebrateError} from 'celebrate';
import {StatusCodes} from 'http-status-codes';
import {NotFoundError} from '../errors';

class ErrorDto {
  public readonly code: ErrorCode;
  public readonly message: string;

  constructor(code: ErrorCode, message: string) {
    this.code = code;
    this.message = message;
  }
}

enum ErrorCode {
  GeneralError = 'generalError',
  InvalidRequest = 'invalidRequest',
  ItemNotFound = 'itemNotFound',
}

class ErrorHandler {
  public async handleError(error: Error, res: Response) {
    console.error(
      util.inspect(error, {showHidden: false, depth: null, colors: true})
    );

    if (isCelebrateError(error)) {
      const errorMessage = Array.from(
        error.details,
        ([, value]) => value.message
      ).reduce(
        (message, nextErrorMessage) => `${message}\n${nextErrorMessage}`
      );

      return res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json(new ErrorDto(ErrorCode.InvalidRequest, errorMessage));
    }

    if (error instanceof RangeError) {
      return res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json(new ErrorDto(ErrorCode.InvalidRequest, error.message));
    }

    if (error instanceof NotFoundError) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(new ErrorDto(ErrorCode.ItemNotFound, error.message));
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(new ErrorDto(ErrorCode.GeneralError, 'internal server error'));
  }
}

export const errorHandler = new ErrorHandler();
