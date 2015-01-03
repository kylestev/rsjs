var fs = require('fs'),
	esprima = require('esprima'),
	createAnalyzer = require('./lib/analyzer').createAnalyzer,
	util = require('./lib/util');

var forceRedownload = false;

var analyseFile = function (filePath, classSearchers) {
	fs.readFile(filePath, function (err, data) {
		if (err) {
			throw err;
		}

		var ast = esprima.parse(data);
		var analyser = createAnalyzer(ast);
		for (var v in classSearchers) {
			classSearchers[v].findClass(analyser);
		}

		console.log(analyser.getIdentifiedClasses());
	});
}

var defs = {
	Bootstrap          : {
		findClass: function (analyser) {
			analyser.getClasses().forEach(function (node) {
				if (node.getName() === 'Bootstrap') {
					analyser.putIdentifiedClass('Bootstrap', node.getName());
				}
			})
		}
	},
	Stream             : {
		findClass: function (analyser) {
			analyser.getClasses().forEach(function (node) {
				var intField = false;
				var intArrayField = false;
				node.getVariables().forEach(function (variable) {
					if (variable.getLiteralValue() === 0) {
						intField = true;
					} else if (variable.getArrayElements().length === 33) {
						intArrayField = true;
					}
				})
				if (intField && intArrayField) {
					analyser.putIdentifiedClass('Stream', node.getName());
					return true;
				}
			})
			return false;
		}
	},
	NPCComposite       : {
		findClass: function (analyser) {
			analyser.getClasses().forEach(function (classNode) {
				var boolField = false;
				var intField = false;
				var constructorParams = false;
				classNode.getVariables().forEach(function (variableNode) {
					if (variableNode.getLiteralValue() === true) {
						boolField = true;
					} else if (variableNode.getLiteralValue() === 6) {
						intField = true;
					} else if (variableNode.getAssignmentFunctionParameters().length === 3) {
						constructorParams = true;
					}
				})
				if (boolField && intField && constructorParams) {
					var fields = {};
					var methods = {};
					var node = {className: classNode.getName(), fields: fields, methods: methods};
					analyser.putIdentifiedClass('NPCComposite', node);
					var decodeMethod = classNode.getFunction('decode');
					if (decodeMethod !== null) {
						decodeMethod.getBody().forEach(function (statement) {
							if (statement['type'] === 'WhileStatement') {
								statement['body']['body'].forEach(function (whileStatement) {
									if (whileStatement['type'] === 'ExpressionStatement' && whileStatement['expression']['type'] === 'CallExpression') {
										methods['readOpcode'] = whileStatement['expression']['callee']['property']['name'];
									}
								})
							}
						})
						var readMethod = classNode.getFunction(methods['readOpcode']);
						if (readMethod !== null) {
							var body = readMethod.getBody()[0];
							while (body !== null && body !== undefined && body['type'] === 'IfStatement') {
								var test = util.getProperty(body, ['test']);
								switch (test['type']) {
									case 'BinaryExpression':
										if (test['right']['type'] === 'Literal') {
											switch (util.getProperty(test, ['right', 'value'])) {
												case 1:
													fields['modelIds'] = util.getProperty(body, ['consequent', 'body', 1, 'expression', 'left', 'property', 'name']);
													break;
												case 2:
													fields['name'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 95:
													fields['combatLevel'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 160:
													fields['questIds'] = util.getProperty(body, ['consequent', 'body', 1, 'expression', 'left', 'property', 'name']);
													break;
											}
										}
										break;
									case 'LogicalExpression':
										switch (util.getProperty(test, ['left', 'right', 'value'])) {
											case 30:
												fields['interactAction'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'object', 'property', 'name']);
												break;
										}
										break;
								}
								body = util.getProperty(body, ['alternate', 'body', 0]);
							}
						}
					}
					return true;
				}
			})
			return false;
		}
	},
	ItemComposite      : {
		findClass: function (analyser) {
			analyser.getClasses().forEach(function (classNode) {
				var intField1 = false;
				var intField2 = false;
				var constructorParams = false;
				classNode.getVariables().forEach(function (variableNode) {
					if (variableNode.getLiteralValue() === 6) {
						intField1 = true;
					} else if (variableNode.getLiteralValue() === 5) {
						intField2 = true;
					} else if (variableNode.getAssignmentFunctionParameters().length === 4) {
						constructorParams = true;
					}
				})
				if (intField1 && intField2 && constructorParams) {
					var fields = {};
					var methods = {};
					var node = {className: classNode.getName(), fields: fields, methods: methods};
					analyser.putIdentifiedClass('ItemComposite', node);
					var decodeMethod = classNode.getFunction('decode');
					if (decodeMethod !== null) {
						decodeMethod.getBody().forEach(function (statement) {
							if (statement['type'] === 'WhileStatement') {
								statement['body']['body'].forEach(function (whileStatement) {
									if (whileStatement['type'] === 'ExpressionStatement' && whileStatement['expression']['type'] === 'CallExpression') {
										methods['readOpcode'] = whileStatement['expression']['callee']['property']['name'];
									}
								})
							}
						})
						var readMethod = classNode.getFunction(methods['readOpcode']);
						if (readMethod !== null) {
							var body = readMethod.getBody()[0];
							while (body !== null && body !== undefined && body['type'] === 'IfStatement') {
								var test = util.getProperty(body, ['test']);
								switch (test['type']) {
									case 'BinaryExpression':
										if (test['right']['type'] === 'Literal') {
											switch (util.getProperty(test, ['right', 'value'])) {
												case 1:
													fields['modelId'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 2:
													fields['name'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 11:
													fields['stackableItem'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 12:
													fields['storeValue'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 16:
													fields['membersOnly'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 65:
													fields['unnotedItem'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 97:
													fields['notedItemId'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 98:
													fields['notedItemTemplateId'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 115:
													fields['teamId'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 132:
													fields['questIds'] = util.getProperty(body, ['consequent', 'body', 1, 'expression', 'left', 'property', 'name']);
													break;
											}
										}
										break;
									case 'LogicalExpression':
										switch (util.getProperty(test, ['left', 'right', 'value'])) {
											case 30:
												fields['groundAction'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'object', 'property', 'name']);
												break;
											case 35:
												fields['inventoryAction'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'object', 'property', 'name']);
												break;
										}
										break;
								}
								body = util.getProperty(body, ['alternate', 'body', 0]);
							}
						}
					}
					return true;
				}
			})
			return false;
		}
	},
	GameObjectComposite: {
		findClass: function (analyser) {
			analyser.getClasses().forEach(function (classNode) {
				var intField = false;
				var nullField = false;
				var constructorParams = false;
				classNode.getVariables().forEach(function (variableNode) {
					if (variableNode.getLiteralValue() === 6) {
						intField = true;
					} else if (variableNode.getLiteralValue() === 'null') {
						nullField = true;
					} else if (variableNode.getAssignmentFunctionParameters().length === 3) {
						constructorParams = true;
					}
				})
				if (intField && nullField && constructorParams) {
					var fields = {};
					var methods = {};
					var node = {className: classNode.getName(), fields: fields, methods: methods};
					analyser.putIdentifiedClass('GameObjectComposite', node);
					var decodeMethod = classNode.getFunction('decode');
					if (decodeMethod !== null) {
						decodeMethod.getBody().forEach(function (statement) {
							if (statement['type'] === 'WhileStatement') {
								statement['body']['body'].forEach(function (whileStatement) {
									if (whileStatement['type'] === 'ExpressionStatement' && whileStatement['expression']['type'] === 'CallExpression') {
										methods['readOpcode'] = whileStatement['expression']['callee']['property']['name'];
									}
								})
							}
						})
						var readMethod = classNode.getFunction(methods['readOpcode']);
						if (readMethod !== null) {
							var body = readMethod.getBody()[0];
							while (body !== null && body !== undefined && body['type'] === 'IfStatement') {
								var test = util.getProperty(body, ['test']);
								switch (test['type']) {
									case 'BinaryExpression':
										if (test['right']['type'] === 'Literal') {
											switch (util.getProperty(test, ['right', 'value'])) {
												case 1:
													fields['modelId'] = util.getProperty(body, ['consequent', 'body', 1, 'expression', 'left', 'property', 'name']);
													break;
												case 2:
													fields['name'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 11:
													fields['stackableItem'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 14:
													fields['sizeX'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 15:
													fields['sizeZ'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 19:
													fields['interactive'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 91:
													fields['membersOnly'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 160:
													fields['questIds'] = util.getProperty(body, ['consequent', 'body', 1, 'expression', 'left', 'property', 'name']);
													break;
											}
										}
										break;
									case 'LogicalExpression':
										switch (util.getProperty(test, ['left', 'right', 'value'])) {
											case 30:
												fields['interactAction'] = util.getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'object', 'property', 'name']);
												break;
										}
										break;
								}
								body = util.getProperty(body, ['alternate', 'body', 0]);
							}
						}
					}
					return true;
				}
			})
			return false;
		}
	}
};

util.downloadBootstrap(forceRedownload, function (bootstrapFile) {
	analyseFile(bootstrapFile, defs);
});
