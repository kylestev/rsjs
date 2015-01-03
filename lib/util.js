var fs = require('fs');
var https = require('https');

function getProperty(node, propertyArray) {
	for (var v in propertyArray) {
		if (node === null || node == undefined || node[propertyArray[v]] === undefined || node[propertyArray[v]] === null) {
			return null;
		}

		node = node[propertyArray[v]];
	}

	return node;
}

var createVariable = new function (variableNode) {
	var JSVariable = function (variableNode) {
		this.node = variableNode;
		this.variableName = getProperty(variableNode, ['declarations', 0, 'id', 'name']);
		this.fieldBody = getProperty(variableNode, ['declarations', 0, 'init']);
		this.type = getProperty(this.fieldBody, ['type']);
	};

	JSVariable.prototype.getNode = function () {
		return this.node;
	};

	JSVariable.prototype.getOwner = function () {
		return this.owner;
	};

	JSVariable.prototype.getName = function () {
		return this.functionName;
	};

	JSVariable.prototype.getType = function () {
		return this.type;
	};

	JSVariable.prototype.getBody = function () {
		return this.fieldBody;
	};

	JSVariable.prototype.getLiteralValue = function () {
		if (this.type !== 'Literal') {
			return undefined;
		}

		return this.fieldBody['value'];
	};

	JSVariable.prototype.getArrayElements = function () {
		if (this.type !== 'ArrayExpression') {
			return [];
		}

		return this.fieldBody['elements'];
	};

	JSVariable.prototype.getAssignmentFunctionParameters = function () {
		if (this.type !== 'FunctionExpression') {
			return [];
		}

		return this.fieldBody['params'];
	};

	return function (variableNode) {
		return new JSVariable(variableNode);
	};
}();

var createFunction = new function (functionNode) {
	var JSFunction = function (functionNode) {
		this.node = functionNode;
		this.owner = getProperty(functionNode, ['expression', 'left', 'object', 'object', 'name']);
		this.functionName = getProperty(functionNode, ['expression', 'left', 'property', 'name']);
		this.body = getProperty(functionNode, ['expression', 'right', 'body', 'body']);
	};

	JSFunction.prototype.getNode = function () {
		return this.node;
	};

	JSFunction.prototype.getOwner = function () {
		return this.owner;
	};

	JSFunction.prototype.getName = function () {
		return this.functionName;
	};

	JSFunction.prototype.getBody = function () {
		return this.body;
	};

	return function (functionNode) {
		return new JSFunction(functionNode);
	};
}();

var createClass = new function (classNode) {
	var JSClass = function (classNode) {
		this.variables = [];
		this.functions = [];
		this.node = classNode;
		this.className = getProperty(classNode, ['declarations', 0, 'id', 'name']);

		var body = getProperty(classNode, ['declarations', 0, 'init', 'callee', 'body', 'body']);
		if (body === null) {
			return;
		}

		for (var v in body) {
			var node = body[v];
			switch (node['type']) {
				case 'VariableDeclaration':
					this.variables.push(createVariable(node));
					break;
				case 'ExpressionStatement':
					this.functions.push(createFunction(node));
					break;
			}
		}
	};

	JSClass.prototype.getNode = function () {
		return this.node;
	};

	JSClass.prototype.getName = function () {
		return this.className;
	};

	JSClass.prototype.getVariables = function () {
		return this.variables;
	};

	JSClass.prototype.getFunctions = function () {
		return this.functions;
	};

	JSClass.prototype.getVariable = function (variableName) {
		var node = null;

		this.variables.forEach(function (variableNode) {
			console.log(variableNode.getName(), " > ", variableName)
			if (variableNode.getName() === variableName) {
				node = variableNode;
				return;
			}
		});

		return node;
	};

	JSClass.prototype.getFunction = function (functionName) {
		var node = null;

		this.functions.forEach(function (functionNode) {
			if (functionNode.getName() === functionName) {
				node = functionNode;
			}
		});

		return node;
	};

	return function (classNode) {
		return new JSClass(classNode);
	};
}();

function downloadBootstrap(forceRedownload, callback) {
	var bsDest = './Bootstrap.js';
	fs.exists(bsDest, function (bsExists) {
		if (!forceRedownload && bsExists) {
			callback(bsDest);
			return;
		}

		var bsFile = fs.createWriteStream(bsDest);
		var request = https.get('https://world17.runescape.com/html5/client/Bootstrap.js', function (response) {
			response.pipe(bsFile);
				bsFile.on('finish', function() {
				bsFile.close(function () {
					callback(bsDest);
				});
		    });
		});
	});
}

module.exports.createClass = createClass;
module.exports.createFunction = createFunction;
module.exports.createVariable = createVariable;
module.exports.downloadBootstrap = downloadBootstrap;
module.exports.getProperty = getProperty;
