/**
 * タスクAPIのhandler レイヤー
 * event objectの受け入れとレスポンス返却
 */

// 自作モジュール
import * as taskLogic from './logic/task-logic.mjs';
import * as utilities from './util/utilities.mjs';
import { getLogger } from './util/logger.mjs';
import { makeSucessResponse, mekeErrorResponse } from './util/make-response.mjs';

const logger = getLogger();

/**
 * タスク作成
 * @param {object} event イベント情報 
 */
export const createTaskHandler = async(event) => {
    logger.info('Task001', utilities.getMessage('Task001', 'Create', JSON.stringify(event)));
    const requestId = utilities.getRequestId(event);

    // NOTE: bodyパラメータの必須チェックはAPI Gatewayで実施済み
    const body = JSON.parse(event.body);
    const title = body.title;
    const detail = body.detail;

    try {
        const userId = utilities.getUserId(event);
        const res = await taskLogic.createTask(userId, title, detail);
        return makeSucessResponse('200', res, requestId);
    } catch (error) {
        logger.error('Task003', utilities.getMessage('Task003', error.stack));
        return mekeErrorResponse(error, requestId);
    } finally {
        logger.info('Task002', utilities.getMessage('Task002', 'Post'));
    }
};

/**
 * タスク1件修正ハンドラー
 * @param {object} event 
 * @returns 
 */
export const getTaskHandler = async(event) => {
    logger.info('Task001', utilities.getMessage('Task001', 'Get', JSON.stringify(event)));
    const requestId = utilities.getRequestId(event);

    try {
        const userId = utilities.getUserId(event);
        const taskId = utilities.getTaskId(event);
        const res = await taskLogic.getTask(userId, taskId);
        return makeSucessResponse('200', res, requestId);
    } catch (error) {
        logger.error('Task003', utilities.getMessage('Task003', error.stack));
        return mekeErrorResponse(error, requestId);
    } finally {
        logger.info('Task002', utilities.getMessage('Task002', 'Get'));
    }
};

/**
 * タスク項目ハンドラー
 * @param {object} event 
 * @returns 
 */
export const updateTaskHandler = async(event) => {
    logger.info('Task001', utilities.getMessage('Task001', 'Update', JSON.stringify(event)));
    const requestId = utilities.getRequestId(event);
    // NOTE: bodyパラメータの必須チェックはAPI Gatewayで実施済み
    const body = JSON.parse(event.body);
    const title = body.title;
    const detail = body.detail;
    const state = body.state;

    try {
        const userId = utilities.getUserId(event);
        const taskId = utilities.getTaskId(event);
        const res = await taskLogic.updateTask(userId, taskId, title, detail, state);
        return makeSucessResponse('200', res, requestId);
    } catch (error) {
        logger.error('Task003', utilities.getMessage('Task003', error.stack));
        return mekeErrorResponse(error, requestId);
    } finally {
        logger.info('Task002', utilities.getMessage('Task002', 'Update'));
    }
};

/**
 * タスク削除ハンドラー
 * @param {object} event 
 * @returns 
 */
export const deleteTaskHandler = async(event) => {
    logger.info('Task001', utilities.getMessage('Task001', 'Delete', JSON.stringify(event)));
    const requestId = utilities.getRequestId(event);

    try {
        const userId = utilities.getUserId(event);
        const taskId = utilities.getTaskId(event);
        await taskLogic.deleteTask(userId, taskId);
        return makeSucessResponse('204', {}, requestId);
    } catch (error) {
        logger.error('Task003', utilities.getMessage('Task003', error.stack));
        return mekeErrorResponse(error, requestId);
    } finally {
        logger.info('Task002', utilities.getMessage('Task002', 'Delete'));
    }
};
