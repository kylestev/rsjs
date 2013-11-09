var fs = require('fs');
var esprima = require('esprima');
function getProperty(node, propertyArray) {
	for (var v in propertyArray) {
		if (node === null || node == undefined || node[propertyArray[v]] === undefined || node[propertyArray[v]] === null) {
			return null;
		}
		node = node[propertyArray[v]];
	}
	return node;
}
var newVariable = new function (variableNode) {
	var JSVariable = function (variableNode) {
		this.node = variableNode;
		this.variableName = getProperty(variableNode, ['declarations', 0, 'id', 'name'])
		this.fieldBody = getProperty(variableNode, ['declarations', 0, 'init'])
		this.type = getProperty(this.fieldBody, ['type'])
	}
	JSVariable.prototype.getNode = function () {
		return this.node;
	}
	JSVariable.prototype.getOwner = function () {
		return this.owner;
	}
	JSVariable.prototype.getName = function () {
		return this.functionName;
	}
	JSVariable.prototype.getType = function () {
		return this.type;
	}
	JSVariable.prototype.getBody = function () {
		return this.fieldBody;
	}
	JSVariable.prototype.getLiteralValue = function () {
		if (this.type !== 'Literal') {
			return undefined;
		}
		return this.fieldBody['value'];
	}
	JSVariable.prototype.getArrayElements = function () {
		if (this.type !== 'ArrayExpression') {
			return [];
		}
		return this.fieldBody['elements'];
	}
	JSVariable.prototype.getAssignmentFunctionParameters = function () {
		if (this.type !== 'FunctionExpression') {
			return [];
		}
		return this.fieldBody['params'];
	}
	return function (variableNode) {
		return new JSVariable(variableNode);
	}
}();
var newFunction = new function (functionNode) {
	var JSFunction = function (functionNode) {
		this.node = functionNode;
		this.owner = getProperty(functionNode, ['expression', 'left', 'object', 'object', 'name'])
		this.functionName = getProperty(functionNode, ['expression', 'left', 'property', 'name'])
		this.body = getProperty(functionNode, ['expression', 'right', 'body', 'body'])
	}
	JSFunction.prototype.getNode = function () {
		return this.node;
	}
	JSFunction.prototype.getOwner = function () {
		return this.owner;
	}
	JSFunction.prototype.getName = function () {
		return this.functionName;
	}
	JSFunction.prototype.getBody = function () {
		return this.body;
	}
	return function (functionNode) {
		return new JSFunction(functionNode);
	}
}();
var newClass = new function (classNode) {
	var JSClass = function (classNode) {
		this.node = classNode;
		this.className = getProperty(classNode, ['declarations', 0, 'id', 'name']);
		this.variables = [];
		this.functions = [];
		var body = getProperty(classNode, ['declarations', 0, 'init', 'callee', 'body', 'body'])
		if (body === null) {
			return;
		}
		for (var v in body) {
			var node = body[v];
			switch (node['type']) {
				case 'VariableDeclaration':
					this.variables.push(newVariable(node))
					break;
				case 'ExpressionStatement':
					this.functions.push(newFunction(node))
					break;
			}
		}
	}
	JSClass.prototype.getNode = function () {
		return this.node;
	}
	JSClass.prototype.getName = function () {
		return this.className;
	}
	JSClass.prototype.getVariables = function () {
		return this.variables;
	}
	JSClass.prototype.getFunctions = function () {
		return this.functions;
	}
	JSClass.prototype.getVariable = function (variableName) {
		var node = null;
		this.variables.forEach(function (variableNode) {
			console.log(variableNode.getName(), " > ", variableName)
			if (variableNode.getName() === variableName) {
				node = variableNode;
				return;
			}
		})
		return node;
	}
	JSClass.prototype.getFunction = function (functionName) {
		var node = null;
		this.functions.forEach(function (functionNode) {
			if (functionNode.getName() === functionName) {
				node = functionNode;
			}
		})
		return node;
	}
	return function (classNode) {
		return new JSClass(classNode);
	}
}();
var newAnalyser = new function (ast) {
	var Analyser = function (tree) {
		this.classes = [];
		this.identifiedClasses = {};
		this.body = tree['body']
		if (this.body === null || this.body === undefined) {
			throw new Error('Error Creating analyser. Failed to find body')
		}
		for (var key in this.body) {
			var child = this.body[key]
			if (getProperty(child, ['type']) === 'VariableDeclaration') {
				this.classes.push(newClass(this.body[key]));
			}
		}
	}
	Analyser.prototype.getClasses = function () {
		return this.classes;
	}
	Analyser.prototype.getIdentifiedClasses = function () {
		return this.identifiedClasses;
	}
	Analyser.prototype.getIdentifiedClass = function (className) {
		return this.identifiedClasses[className];
	}
	Analyser.prototype.putIdentifiedClass = function (className, identifiedName) {
		this.identifiedClasses[className] = identifiedName;
	}
	Analyser.prototype.getBody = function () {
		return this.body;
	}
	return function (ast) {
		return new Analyser(ast)
	}
}();
var analyseFile = function (filePath, classSearchers) {
	fs.readFile(filePath, function (err, data) {
		if (err) {
			throw err;
		}
		var ast = esprima.parse(data);
		var analyser = newAnalyser(ast);
		for (var v in classSearchers) {
			classSearchers[v].findClass(analyser);
		}
		console.log(analyser.getIdentifiedClasses())
	});
}
analyseFile("revisions\\Bootstrap29-10-2013.js", {
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
								var test = getProperty(body, ['test']);
								switch (test['type']) {
									case 'BinaryExpression':
										if (test['right']['type'] === 'Literal') {
											switch (getProperty(test, ['right', 'value'])) {
												case 1:
													fields['modelIds'] = getProperty(body, ['consequent', 'body', 1, 'expression', 'left', 'property', 'name']);
													break;
												case 2:
													fields['name'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 95:
													fields['combatLevel'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 160:
													fields['questIds'] = getProperty(body, ['consequent', 'body', 1, 'expression', 'left', 'property', 'name']);
													break;
											}
										}
										break;
									case 'LogicalExpression':
										switch (getProperty(test, ['left', 'right', 'value'])) {
											case 30:
												fields['interactAction'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'object', 'property', 'name']);
												break;
										}
										break;
								}
								body = getProperty(body, ['alternate', 'body', 0]);
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
								var test = getProperty(body, ['test']);
								switch (test['type']) {
									case 'BinaryExpression':
										if (test['right']['type'] === 'Literal') {
											switch (getProperty(test, ['right', 'value'])) {
												case 1:
													fields['modelId'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 2:
													fields['name'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 11:
													fields['stackableItem'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 12:
													fields['storeValue'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 16:
													fields['membersOnly'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 65:
													fields['unnotedItem'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 97:
													fields['notedItemId'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 98:
													fields['notedItemTemplateId'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 115:
													fields['teamId'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 132:
													fields['questIds'] = getProperty(body, ['consequent', 'body', 1, 'expression', 'left', 'property', 'name']);
													break;
											}
										}
										break;
									case 'LogicalExpression':
										switch (getProperty(test, ['left', 'right', 'value'])) {
											case 30:
												fields['groundAction'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'object', 'property', 'name']);
												break;
											case 35:
												fields['inventoryAction'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'object', 'property', 'name']);
												break;
										}
										break;
								}
								body = getProperty(body, ['alternate', 'body', 0]);
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
								var test = getProperty(body, ['test']);
								switch (test['type']) {
									case 'BinaryExpression':
										if (test['right']['type'] === 'Literal') {
											switch (getProperty(test, ['right', 'value'])) {
												case 1:
													fields['modelId'] = getProperty(body, ['consequent', 'body', 1, 'expression', 'left', 'property', 'name']);
													break;
												case 2:
													fields['name'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 11:
													fields['stackableItem'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 14:
													fields['sizeX'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 15:
													fields['sizeZ'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 19:
													fields['interactive'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 91:
													fields['membersOnly'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'property', 'name']);
													break;
												case 160:
													fields['questIds'] = getProperty(body, ['consequent', 'body', 1, 'expression', 'left', 'property', 'name']);
													break;
											}
										}
										break;
									case 'LogicalExpression':
										switch (getProperty(test, ['left', 'right', 'value'])) {
											case 30:
												fields['interactAction'] = getProperty(body, ['consequent', 'body', 0, 'expression', 'left', 'object', 'property', 'name']);
												break;
										}
										break;
								}
								body = getProperty(body, ['alternate', 'body', 0]);
							}
						}
					}
					return true;
				}
			})
			return false;
		}
	}
});