/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import { getMessageById, getMessageByNode, MessageCategoryId, MessageContentType } from "../../../src/generators/messages";
import { ZoweDatasetNode } from "../../../src/dataset/ZoweDatasetNode";
import { imperative } from "@zowe/cli";
import { DatasetTree } from "../../../src/dataset/DatasetTree";
import * as vscode from "vscode";

jest.mock("vscode");

describe("Checking message generator's basics", () => {
    const setGlobalMocks = () => {
        const createTreeView = jest.fn().mockReturnValue({ onDidCollapseElement: jest.fn() });
        const getConfiguration = jest.fn();

        Object.defineProperty(vscode.window, "createTreeView", { value: createTreeView });
        Object.defineProperty(vscode.workspace, "getConfiguration", { value: getConfiguration });
    };
    const generateTestSessionNode = () => {
        const session = new imperative.Session({
            user: "fake",
            password: "fake",
            hostname: "fake",
            port: 443,
            protocol: "https",
            type: "basic",
        });
        const testTree = new DatasetTree();
        const profile: imperative.IProfileLoaded = {
            name: "aProfile",
            profile: {},
            type: "zosmf",
            message: "",
            failNotFound: false,
        };
        return new ZoweDatasetNode({ label: "session", collapsibleState: vscode.TreeItemCollapsibleState.Collapsed, session, profile });
    };
    const generateTestDatasetMemberNode = (session: ZoweDatasetNode) => {
        const parent = new ZoweDatasetNode({
            label: "pds",
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            parentNode: session,
            session: session.getSession(),
            profile: session.getProfile(),
        });
        return new ZoweDatasetNode({
            label: "member",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            parentNode: parent,
            session: parent.getSession(),
            profile: parent.getProfile(),
        });
    };

    setGlobalMocks();

    it("Testing that you can correctly get Message by ID", () => {
        const targetId = MessageCategoryId.dataset;
        const resultMessage = getMessageById(targetId, MessageContentType.upload);

        expect(resultMessage).not.toBeNull();
        expect(resultMessage).toBe("Saving data set...");
    });
    it("Testing that you can't get Message with not existing ID", () => {
        const targetId = "some-not-existing-id";
        const resultMessage = getMessageById(targetId as any, MessageContentType.upload);

        expect(resultMessage).toBeNull();
    });
    it("Testing that you can correctly get Generic Message by Node", () => {
        const sessionNode = generateTestSessionNode();
        const resultMessage = getMessageByNode(sessionNode, MessageContentType.upload);

        expect(resultMessage).not.toBeNull();
        expect(resultMessage).toBe("Saving data set...");
    });
    it("Testing that you can correctly get Specific Message By Node", () => {
        const sessionNode = generateTestSessionNode();
        const memberNode = generateTestDatasetMemberNode(sessionNode);
        const resultMessage = getMessageByNode(memberNode, MessageContentType.upload);

        expect(resultMessage).not.toBeNull();
        expect(resultMessage).toBe("Saving data set member...");
    });
    it("Testing that you can't get Specific Message using incorrect Node", () => {
        const randomNode = {};
        const resultMessage = getMessageByNode(randomNode, MessageContentType.upload);
        expect(resultMessage).toBeNull();
    });
});
