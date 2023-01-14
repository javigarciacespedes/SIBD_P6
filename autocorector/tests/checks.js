// IMPORTS
const assert = require('chai').assert
const expect = require('chai').expect
const path = require('path');
const Utils = require('../utils/testutils');
const T_TEST = 2 * 60; // Time between tests (seconds)
const controller = require('../../controllers/patient');
const Patient = require('../../models/patient');
const mongoose = require('mongoose');

// CRITICAL ERRORS
let error_critical = null;
let testPatient;

let connConfigServer;
let connShard1_1;
let connShard1_2;
let connShard2_1;
let connShard2_2;
let connMongos;
let connMongosBioBbdd;

beforeEach( async () => {
	const data = [
	   {
			name: 'Juan',
			surname: 'Rodriguez',
			dni: '123123',
			city: "Madrid",
			profession: [
				"Frutero",
				"Monitor de tiempo libre"
			],
			medicalHistory: [
				{
					"specialist": "Medico de cabecera",
					"diagnosis": "Resfriado",
					"date": new Date( 2017,4,4)
				},
				{
					"specialist": "Dermatólogo",
					"diagnosis": "Escorbuto",
					"date": new Date( 2016,11,14)
				}
			]
		},
		{
			name: 'Andres',
			surname: 'Lopez',
			dni: '222333',
			city: "Cuenca",
			profession: [
				"Futbolista"
			],
			medicalHistory: [
				{
					"specialist": "Medico de cabecera",
					"diagnosis": "Resaca",
					"date": new Date( 2018,11,14)
				},
				{
					"specialist": "Traumatologo",
					"diagnosis": "Fractura de ligamento cruzado",
					"date": new Date( 2015,5,14)
				},
				{
					"specialist": "Traumatologo",
					"diagnosis": "Esguince de tobillo",
					"date": new Date( 2016,4,24)
				}
			]
		},
		{
			name: 'Carlos',
			surname: 'Lechon',
			dni: '333444',
			city: "Madrid",
			profession: [
				"Lechero",
				"Repartidor"
			],
			medicalHistory: [
				{
					"specialist": "Reumatologo",
					"diagnosis": "Osteoporosis",
					"date": new Date( 2016,5,14)
				},
				{
					"specialist": "Medico de cabecera",
					"diagnosis": "Resfriado",
					"date": new Date( 2017,1,5)
				}
			]
		},
		{
			name: 'Diana',
			surname: 'Pintor',
			dni: '555666',
			city: "Melilla",
			profession: [
				"Pintora",
				"Directora de subastas"
			],
			medicalHistory: [
				{
					"specialist": "Medico de cabecera",
					"diagnosis": "Diarrea aguda",
					"date": new Date( 2016,5,14)
				},
				{
					"specialist": "Traumatologo",
					"diagnosis": "Síndrome del tunel carpiano",
					"date": new Date( 2019,3,15)
				}
			]
		},
		{
			name: 'Raquel',
			surname: 'Dueñas',
			dni: '666777',
			city: "Barcelona",
			profession: [
				"Chef",
				"Ayudante de cocina",
				"Camarero"
			],
			medicalHistory: [
				{
					"specialist": "Cardiologo",
					"diagnosis": "Arritmia",
					"date": new Date( 2019,3,26)
				},
				{
					"specialist": "Medico de cabecera",
					"diagnosis": "Dermatitis",
					"date": new Date( 2017,1,5)
				}
			]
		},
		{
			name: 'Mario Alejandro',
			surname: 'Arcentales',
			dni: '777888',
			city: "Oviedo",
			profession: [
				"Minero"
			],
			medicalHistory: [
				{
					"specialist": "Endocrino",
					"diagnosis": "Anemia crónica",
					"date": new Date( 2018,10,26)
				},
				{
					"specialist": "Neumologo",
					"diagnosis": "Silicosis",
					"date": new Date( 2019,10,5)
				}
			]
		},
		{
			_id: new mongoose.Types.ObjectId('5e4a60fb7be8f229b54a16cb'),
			name: 'Ana',
			surname: 'Durcal',
			dni: '555555',
			city: "Huelva",
			profession: [
				"Frutera",
				"Monitora de tiempo libre"
			],
			medicalHistory: []
		}

	];
	testPatient = {
		_id: new mongoose.Types.ObjectId('5e3a60fb7be8f029b54a16c9'),
		name: 'Ana',
		surname: 'Durcal',
		dni: '555555',
		city: "Huelva",
		profession: [
			"Frutera",
			"Monitora de tiempo libre"
		],
		medicalHistory: []
	};
	//test = await Patient.collection.insertMany(data);
});


// Close connection
after((done) => {
	mongoose.connection.close()
	connConfigServer.close()
	connShard1_1.close();
	connShard1_2.close();
	connShard2_1.close();
	connShard2_2.close();
	connMongos.close();
	connMongosBioBbdd.close();
	done()
});

//TESTS
describe("BBDD Tests", function () {

	describe('Config Server', function() {
        it('Config Server should be up and running', function(done) {
            this.score = 0.5;
            this.msg_ok = "The config Server is up and running";
            this.msg_err = "The config server is not running or is not enable on port 27001";

		    connConfigServer = mongoose.createConnection("mongodb://127.0.0.1:27001/admin",{ serverSelectionTimeoutMS: 5000});
		    connConfigServer.on('error', (err) => {
		    	if (err.message && err.message.includes('ECONNREFUSED')) {
		    		this.msg_err = "The config server is not running or is not enable on port 27001";
		    	}
		    	if (err.message && err.message.includes('Server selection')) {
		    		this.msg_err = "The replicaSet of config server is probably not initialized";
		    	}
		    	done(new Error("Error on config server"))
			});
			connConfigServer.on('connected', done);
		})
    });

	describe('Config Server', function() {
    	it('Config Server should be well configured', async function() {
            this.score = 1.0;
            this.msg_ok = "The config Server is well configured";
            this.msg_err = "The config server is not started on config server mode or replica not intialized";

	    	result_line_opts = await connConfigServer.db.command({"getCmdLineOpts":1 });
	    	expect(result_line_opts.argv).to.include('--configsvr');
	    	this.msg_err = "The config server is not started on config replica mode";
	    	expect(result_line_opts.argv).to.include('--replSet');
	    	this.msg_err = "The replica is not name 'config_servers'";
	    	expect(result_line_opts.argv).to.include('config_servers');

	    	this.msg_err = "The replicaSet is not initialized with configsvr flag";
	    	result_repl_config = await connConfigServer.db.command({"replSetGetConfig":1 });
	    	assert.equal(result_repl_config.config.configsvr, true);

	    	this.msg_err = "The config server replicaSet should include at least one member";
	    	result_status = await connConfigServer.db.command({"replSetGetStatus":1 });
	    	assert.isAtLeast(result_status.members.length, 1)
		})
	});

	describe('Shard Cluster 1', function() {
        it('127.0.0.1:27002 should be up and running', function(done) {
            this.score = 0.5;
            this.msg_ok = "127.0.0.1:27002 is up and running";
            this.msg_err = "127.0.0.1:27002 is not running or is not enable on port 27002";

		    connShard1_1 = mongoose.createConnection("mongodb://127.0.0.1:27002/admin",{ serverSelectionTimeoutMS: 5000});
		    connShard1_1.on('error', (err) => {
		    	if (err.message && err.message.includes('ECONNREFUSED')) {
		    		this.msg_err = "127.0.0.1:27002 is not running or is not enable on port 27002";
		    	}
		    	if (err.message && err.message.includes('Server selection')) {
		    		this.msg_err = "The replicaSet is probably not initialized";
		    	}
		    	done(new Error("Error on config server"))
			});
			connShard1_1.on('connected', done);
		})
    });

    describe('Shard Cluster 1', function() {
        it('127.0.0.1:27003 should be up and running', function(done) {
            this.score = 0.5;
            this.msg_ok = "127.0.0.1:27003 is up and running";
            this.msg_err = "127.0.0.1:27003 is not running or is not enable on port 27003";

		    connShard1_2 = mongoose.createConnection("mongodb://127.0.0.1:27003/admin",{ serverSelectionTimeoutMS: 5000});
		    connShard1_2.on('error', (err) => {
		    	if (err.message && err.message.includes('ECONNREFUSED')) {
		    		this.msg_err = "127.0.0.1:27003 is not running or is not enable on port 27003";
		    	}
		    	if (err.message && err.message.includes('Server selection')) {
		    		this.msg_err = "The replicaSet is probably not initialized";
		    	}
		    	done(new Error("Error on config server"))
			});
			connShard1_2.on('connected', done);
		})
    });

    describe('Shard Cluster 1', function() {
    	it('Shard Cluster 1 should be well configured', async function() {
            this.score = 0.5;
            this.msg_ok = "The shard cluster is well configured";
            this.msg_err = "The replicaSet is probably not initialized";

	    	let result_line_opts_1 = await connShard1_1.db.command({"getCmdLineOpts":1 });
	    	let result_line_opts_2 = await connShard1_2.db.command({"getCmdLineOpts":1 });

	    	this.msg_err = "The 127.0.0.1:27002 is not started on replica mode";
		    expect(result_line_opts_1.argv).to.include('--replSet');

	    	this.msg_err = "The 127.0.0.1:27002 is not started on shard mode";
	    	expect(result_line_opts_1.argv).to.include('--shardsvr');

	    	this.msg_err = "The 127.0.0.1:27003 is not started on replica mode";
	    	expect(result_line_opts_2.argv).to.include('--replSet');

	    	this.msg_err = "The 127.0.0.1:27003 is not started on shard mode";
	    	expect(result_line_opts_2.argv).to.include('--shardsvr');

	    	result_status = await connShard1_1.db.command({"replSetGetStatus":1 });

	    	let mem1 = result_status.members.filter(mem => mem.name.includes('27002'))[0];
	    	this.msg_err = "The 127.0.0.1:27002 should be PRIMARY";
	    	should.equal(mem1.stateStr, 'PRIMARY');
	    	let mem2 = result_status.members.filter(mem => mem.name.includes('27003'))[0];
	    	this.msg_err = "The 127.0.0.1:27003 should be SECONDARY";
	    	should.equal(mem2.stateStr, 'SECONDARY');

	    	result_config = await connShard1_1.db.command({"replSetGetConfig":1 });

	    	this.msg_err = "The 127.0.0.1:27002 should have priority 900";
	    	mem1 = result_config.config.members.filter(mem => mem.host.includes('27002'))[0];
	    	should.equal(mem1.priority, 900);

	    	this.msg_err = "The 127.0.0.1:27003 should have priority 700";
	    	mem2 = result_config.config.members.filter(mem => mem.host.includes('27003'))[0];
	    	should.equal(mem2.priority, 700);
		})
	});

	describe('Shard Cluster 2', function() {
        it('127.0.0.1:27004 should be up and running', function(done) {
            this.score = 0.5;
            this.msg_ok = "127.0.0.1:27004 is up and running";
            this.msg_err = "127.0.0.1:27004 is not running or is not enable on port 27004";

		    connShard2_1 = mongoose.createConnection("mongodb://127.0.0.1:27004/admin",{ serverSelectionTimeoutMS: 5000});
		    connShard2_1.on('error', (err) => {
		    	if (err.message && err.message.includes('ECONNREFUSED')) {
		    		this.msg_err = "127.0.0.1:27004 is not running or is not enable on port 27004";
		    	}
		    	if (err.message && err.message.includes('Server selection')) {
		    		this.msg_err = "The replicaSet is probably not initialized";
		    	}
		    	done(new Error("Error on config server"))
			});
			connShard2_1.on('connected', done);
		})
    });

    describe('Shard Cluster 2', function() {
        it('127.0.0.1:27005 should be up and running', function(done) {
            this.score = 0.5;
            this.msg_ok = "127.0.0.1:27005 is up and running";
            this.msg_err = "127.0.0.1:27005 is not running or is not enable on port 27005";

		    connShard2_2 = mongoose.createConnection("mongodb://127.0.0.1:27005/admin",{ serverSelectionTimeoutMS: 5000});
		    connShard2_2.on('error', (err) => {
		    	if (err.message && err.message.includes('ECONNREFUSED')) {
		    		this.msg_err = "127.0.0.1:27005 is not running or is not enable on port 27005";
		    	}
		    	if (err.message && err.message.includes('Server selection')) {
		    		this.msg_err = "The replicaSet is probably not initialized";
		    	}
		    	done(new Error("Error on config server"))
			});
			connShard2_2.on('connected', done);
		})
    });

    describe('Shard Cluster 2', function() {
    	it('Shard Cluster 2 should be well configured', async function() {
            this.score = 0.5;
            this.msg_ok = "The shard cluster is well configured";
            this.msg_err = "The replicaSet is probably not initialized";

	    	let result_line_opts_1 = await connShard2_1.db.command({"getCmdLineOpts":1 });
	    	let result_line_opts_2 = await connShard2_2.db.command({"getCmdLineOpts":1 });

	    	this.msg_err = "The 127.0.0.1:27004 is not started on replica mode";
		    expect(result_line_opts_1.argv).to.include('--replSet');

	    	this.msg_err = "The 127.0.0.1:27004 is not started on shard mode";
	    	expect(result_line_opts_1.argv).to.include('--shardsvr');

	    	this.msg_err = "The 127.0.0.1:27005 is not started on replica mode";
	    	expect(result_line_opts_2.argv).to.include('--replSet');

	    	this.msg_err = "The 127.0.0.1:27005 is not started on shard mode";
	    	expect(result_line_opts_2.argv).to.include('--shardsvr');

	    	result_status = await connShard2_1.db.command({"replSetGetStatus":1 });

	    	let mem1 = result_status.members.filter(mem => mem.name.includes('27004'))[0];
	    	this.msg_err = "The 127.0.0.1:27004 should be PRIMARY";
	    	should.equal(mem1.stateStr, 'PRIMARY');
	    	let mem2 = result_status.members.filter(mem => mem.name.includes('27005'))[0];
	    	this.msg_err = "The 127.0.0.1:27005 should be SECONDARY";
	    	should.equal(mem2.stateStr, 'SECONDARY');

	    	result_config = await connShard2_1.db.command({"replSetGetConfig":1 });

	    	this.msg_err = "The 127.0.0.1:27004 should have priority 600";
	    	mem1 = result_config.config.members.filter(mem => mem.host.includes('27004'))[0];
	    	should.equal(mem1.priority, 600);

	    	this.msg_err = "The 127.0.0.1:27005 should have priority 300";
	    	mem2 = result_config.config.members.filter(mem => mem.host.includes('27005'))[0];
	    	should.equal(mem2.priority, 300);
		})
	});

	describe('Mongos', function() {
        it('127.0.0.1:27006 should be up and running', function(done) {
            this.score = 0.5;
            this.msg_ok = "127.0.0.1:27006 is up and running";
            this.msg_err = "127.0.0.1:27006 is not running or is not enable on port 27006";

		    connMongos = mongoose.createConnection("mongodb://127.0.0.1:27006/admin",{ serverSelectionTimeoutMS: 5000});
		    connMongos.on('error', (err) => {
		    	if (err.message && err.message.includes('ECONNREFUSED')) {
		    		this.msg_err = "127.0.0.1:27006 is not running or is not enable on port 27006";
		    	}
		    	done(new Error("Error on config server"))
			});
			connMongos.on('connected', done);
		})
    });

    describe('Mongos', function() {
    	it('Mongos should be well configured', async function() {
            this.score = 1.5;
            this.msg_ok = "The router mongos is well configured";
            this.msg_err = "The Mongos is probably not initialized with the configdb option";

	    	let result_line_opts_1 = await connMongos.db.command({"getCmdLineOpts":1 });
		    expect(result_line_opts_1.argv).to.include('--configdb');

		    this.msg_err = "The Mongos is probably that the configdb option is not well configured. Review, in the running Mongos command, the name of the confiServer replicaset and the port of config server";
		    let isPointingConfigServer = result_line_opts_1.argv.filter(elm => elm.includes('config_servers') && elm.includes('27001'))
		    should.equal(isPointingConfigServer.length, 1);

		    let results_sharding_status = await connMongos.db.command({"dbStats": 1 });

		    this.msg_err = "There should be included two shard clusters into the system";
		    should.equal(Object.keys(results_sharding_status.raw).length, 2);

		    this.msg_err = "There shard cluster (127.0.0.1:27002 and 127.0.0.1:27003) is not well added";
		    mem1 = Object.keys(results_sharding_status.raw).filter(mem => mem.includes('27002') && mem.includes('27003'))[0];
		    assert.notEqual(mem1, null);

		    this.msg_err = "There shard cluster (127.0.0.1:27004 and 127.0.0.1:27005) is not well added";
		    mem2 = Object.keys(results_sharding_status.raw).filter(mem => mem.includes('27004') && mem.includes('27005'))[0];
		    assert.notEqual(mem2, null);
		})
	});

	describe('Mongos', function() {
    	it('Should connect to bio_bbdd database', function(done) {
    		this.score = 0.0;
            this.msg_ok = "The database is created";
            this.msg_err = "The bio_bbdd database is probably not created";

            connMongosBioBbdd = mongoose.createConnection("mongodb://127.0.0.1:27006/bio_bbdd",{ serverSelectionTimeoutMS: 5000});
            connMongosBioBbdd.on('error', (err) => {
		    	done(new Error("Error on config server"))
			});
			connMongosBioBbdd.on('connected', done);
		})
	});

	describe('Mongos', function() {
    	it('Should have sharded patients database from bio_bbdd', async function() {
    		this.score = 1.5;
            this.msg_ok = "The database is well sharded";
            this.msg_err = "One of the two sharded clusters does not included the patients collection or is has not been enable sharding on the database";

            let results_sharding_status = await connMongosBioBbdd.db.command({"dbStats": 1 });
            assert.isAtLeast(results_sharding_status.raw[Object.keys(results_sharding_status.raw)[0]].collections, 1)
            assert.isAtLeast(results_sharding_status.raw[Object.keys(results_sharding_status.raw)[1]].collections, 1)

            this.msg_err = "The npm run seed command should be run or the sharding has not been performed correctly. Each sharding cluster should have at least 3 objects created on patients collection. Run db.patients.getShardDistribution() inside bio_bbdd database on Mongos router to get more information.";
            assert.isAtLeast(results_sharding_status.raw[Object.keys(results_sharding_status.raw)[0]].objects, 3)
            assert.isAtLeast(results_sharding_status.raw[Object.keys(results_sharding_status.raw)[1]].objects, 3)
		})
	});

	describe('Get Patients list', function() {
        it('Getting the list of all available patients', async function() {
        	this.timeout(1000);
            this.score = 1.0;
            this.msg_ok = "Patients listed correctly!"
            this.msg_err = "The patients have not been listed correctly. Check the mongo URL in controller/patient.js"
            const patients = await controller.list();
            assert.isAtLeast(patients.length, 7)
        })
    });

    describe('Check if there is arbiter', function() {
        it('Shpuld exists an instance of mongo configured as arbiter in the first shard cluster', async function() {
            this.score = 1.0;
            this.msg_ok = "Arbiter found!";
            this.msg_err = "Arbiter not found";
			result = await connShard1_1.db.command({"replSetGetConfig":1 });
			let arbiters = result.config.members.map(a => a.arbiterOnly);
			assert.isAtLeast(result.config.members.length, 3)
			expect(arbiters).to.include(true)
		})
    });
});
