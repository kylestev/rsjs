var util = require('../util');

var Analyzer = function (tree) {
	this.classes = [];
	this.body = tree['body'];
	this.identifiedClasses = {};

	if (this.body === null || this.body === undefined) {
		throw new Error('Error Creating analyzer. Failed to find body')
	}

	for (var key in this.body) {
		var child = this.body[key];
		if (util.getProperty(child, ['type']) === 'VariableDeclaration') {
			this.classes.push(util.createClass(this.body[key]));
		}
	}
}

Analyzer.prototype.getClasses = function () {
	return this.classes;
}

Analyzer.prototype.getIdentifiedClasses = function () {
	return this.identifiedClasses;
}

Analyzer.prototype.getIdentifiedClass = function (className) {
	return this.identifiedClasses[className];
}

Analyzer.prototype.putIdentifiedClass = function (className, identifiedName) {
	this.identifiedClasses[className] = identifiedName;
}

Analyzer.prototype.getBody = function () {
	return this.body;
}

var createAnalyzer = function (ast) {
	return new Analyzer(ast);
}

module.exports.createAnalyzer = createAnalyzer;
