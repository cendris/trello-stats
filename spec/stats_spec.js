var SandboxedModule = require('sandboxed-module');

describe('appendListAndCardInfos', function() {
	var dummyApi = {
		get:function(path, filter, callback) {
			var card1 = {name : 'a first card', id: 111};
			var card2 = {name : 'a second card (2)', id: 222, idMembers: ['abc', 'opc']};
			var list1 = {name: 'a first list', id: 123, cards : [card1]};
			var list2 = {name: 'a second list', id: 345, cards : [card2]};
			callback(null, [list1, list2]);
		}
	};
	var sts = SandboxedModule.require('../lib/stats', { locals: {api: dummyApi} });
	var data = [{card_id: '123'}];

	it('should append list infos', function(done) {
		sts.appendListAndCardInfos(data, function(error, newData) {
			expect(newData[0].list_name).toEqual('a first list');
			expect(newData[1].list_name).toEqual('a second list');
			done();
		});
	});

	it('should append card infos', function(done) {
		sts.appendListAndCardInfos(data, function(error, newData) {
			expect(newData[0].card_name).toEqual('a first card');
			expect(newData[0].card_id).toEqual(111);
			expect(newData[1].card_name).toEqual('a second card (2)');
			expect(newData[1].estimate).toEqual('2');
			expect(newData[1].idMembers).toEqual(['abc', 'opc']);
			done();
		});
	});
});

describe('filterOnlyReleased', function() {
	var sts = require('../lib/stats');
	var data = [
		{card_id: '123', list_name: 'not released'},
		{card_id: '124', list_name: 'Released:'}
	];
	it('should filter only released items', function(done) {
		sts.filterOnlyReleased(data, function(error, newData) {
			expect(newData.length).toEqual(1);
			expect(newData[0].card_id).toEqual('124');
			done();
		})
	})
});

describe('appendDateAndVersionFromListTitle', function() {
	var sts = require('../lib/stats');
	var data = [
		{card_id: '123', list_name: 'Released: 2012-10-10--2020-09-09 v.23.platform'}
	];
	it('should append date', function(done) {
		sts.appendDateAndVersionFromListTitle(data, function(error, newData) {
			expect(newData.length).toEqual(1);
			expect(newData[0].sprint_range).toEqual('2012-10-10--2020-09-09');
			expect(newData[0].versions).toEqual('v.23.platform');
			done();
		})
	})
});

describe('appendMemberInfos', function() {
	var dummyApi = {
		get:function(path, callback) {
			var member = {fullName: 'franky'};
			callback(null, member);          
		}
	};
	var sts = SandboxedModule.require('../lib/stats', { locals: {api: dummyApi} });
	var data = [{idMembers: ['123', '234']}];

	it('should append member names', function(done) {
		sts.appendMemberInfos(data, function(error, newData) {
			expect(newData.length).toEqual(1);
			expect(newData[0].member_names).toEqual(['franky','franky']);
			expect(newData[0].idMembers).toEqual(null);
			done();
		})
	})
});


describe('appendLabelInfosAndFeatureAreas', function () {
	var dummyApi = {
		get:function(path, callback) {
			var card = {name: 'a first board name', id: 123, labels: [{name:'a label'}, {name:'a 2nd label'}], desc: 'This is a description. FeatureArea:anarea '};
			callback(null, card);          
		}
	};
	var sts = SandboxedModule.require('../lib/stats', { locals: {api: dummyApi} });
	var data = [{card_id: '123'}];

	it('should append labels', function (done) {
		sts.appendLabelInfosAndFeatureAreas(data, function(error, newData) {
			expect(newData[0].label).toEqual('a label');
			//expect(newData[1].label).toEqual('a 2nd label');
			done()
		});
	});
/*
	it('should append feature areas', function(done) {
		sts.appendLabelInfosAndFeatureAreas(data, function(error, newData) {
			expect(newData[0].feature_area).toEqual('anarea ');
			done()
		});
*/
});

//TODO weiter ausbauen
describe('appendStartAndDone', function() {
	var dummyApi = {
		get:function(path, filter, callback) {
			var actions = [{data: {listAfter: {name: 'In Arbeit'} }, date: new Date()}];
			callback(null, actions);
		}
	};
	var sts = SandboxedModule.require('../lib/stats', { locals: {api: dummyApi} });
	var data = [{idMembers: ['123', '234']}];

	it('should append member names', function(done) {
		sts.appendStartAndDone(data, function(error, newData) {
			expect(newData.length).toEqual(1);
			done();
		})
	})
});

describe('calculateWorkingHours', function() {
		var moment = require('moment');
		var sts = require('../lib/stats');
		var monday_at_8 = new Date(2012, 7-1, 2, 8, 00);
		var monday_at_9 = new Date(2012, 7-1, 2, 9, 00);
		var monday_at_10 = new Date(2012, 7-1, 2, 10, 00);
		var monday_at_10_05 = new Date(2012, 7-1, 2, 10, 05);
		var monday_at_11 = new Date(2012, 7-1, 2, 11, 00);
		var monday_at_18 = new Date(2012, 7-1, 2, 18, 00);
		var monday_at_19 = new Date(2012, 7-1, 2, 19, 00);
		var friday_at_18 = new Date(2012, 7-1, 6, 18, 00);
		var tuesday_at_9 = new Date(2012, 7-1, 3, 9, 00);
		var next_monday_at_18 = new Date(2012, 7-1, 9, 18, 00);


		it('should return 0 if start and end are equal', function(){
			expect(sts.calculateWorkingHours(monday_at_10, monday_at_10)).toEqual(0);
		});
		it('should return 1 if diff is 1 hour', function(){
			expect(sts.calculateWorkingHours(monday_at_10, monday_at_11)).toEqual(1);
		});
		it('should return 0 if diff is 5 minutes', function(){
			expect(sts.calculateWorkingHours(monday_at_10, monday_at_10_05)).toEqual(0);
		});
		it('should return 8 if started at 9 and ended at 18', function(){
			expect(sts.calculateWorkingHours(monday_at_9, monday_at_18)).toEqual(8);
		});
		it('should return 8 if started at 8 and ended at 18', function(){
			expect(sts.calculateWorkingHours(monday_at_8, monday_at_18)).toEqual(8);
		});
		it('should return 8 if started at 9 and ended at 19', function(){
			expect(sts.calculateWorkingHours(monday_at_9, monday_at_19)).toEqual(8);
		});

		it('should return 40 if started on monday 9 and ended friday 18', function(){
			expect(sts.calculateWorkingHours(monday_at_9, friday_at_18)).toEqual(40);
		});

		it('should return 40 if started on tuesday 9 and ended monday next week 18', function(){
			expect(sts.calculateWorkingHours(tuesday_at_9, next_monday_at_18)).toEqual(40);
		});

});

describe('duplicateEntryForEachMember', function(){
	var sts = require('../lib/stats');
	var data = [{card_id: '123', member_names : ['matt', 'dave']}];

	it('should duplicate an entry with two members assigned', function(done){
		sts.duplicateEntryForEachMember(data, function(error, newData) {
			expect(newData.length).toEqual(2);
			expect(newData[0].member).toEqual('matt');
			expect(newData[0].card_id).toEqual('123');
			expect(newData[1].member).toEqual('dave');
			expect(newData[1].card_id).toEqual('123');
			done();
		});
	});

	var data2 = [{card_id: '123', member_names : []}];
	it('should keep an entry with no members assigned', function(done){
		sts.duplicateEntryForEachMember(data2, function(error, newData) {
			expect(newData.length).toEqual(1);
			expect(newData[0].member).toEqual('<unknown>');
			expect(newData[0].card_id).toEqual('123');
			done();
		});
	});
});

