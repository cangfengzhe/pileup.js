/* @flow */
'use strict';

import {expect} from 'chai';

import ContigInterval from '../main/ContigInterval';

describe('ContigInterval', function(done) {

  it('should have basic accessors', function(done) {
    var tp53 = new ContigInterval(10, 7512444, 7531643);
    expect(tp53.toString()).to.equal('10:7512444-7531643');
    expect(tp53.contig).to.equal(10);
    expect(tp53.start()).to.equal(7512444);
    expect(tp53.stop()).to.equal(7531643);
    expect(tp53.length()).to.equal(19200);
    done();
  });

  it('should determine intersections', function(done) {
    var tp53 = new ContigInterval(10, 7512444, 7531643);
    var other = new ContigInterval(10, 7512444, 7531642);

    expect(tp53.intersects(other)).to.be.true;
    done();
  });

  it('should determine containment', function(done) {
    var ci = new ContigInterval('20', 1000, 2000);
    expect(ci.containsLocus('20', 999)).to.be.false;
    expect(ci.containsLocus('20', 1000)).to.be.true;
    expect(ci.containsLocus('20', 2000)).to.be.true;
    expect(ci.containsLocus('20', 2001)).to.be.false;
    expect(ci.containsLocus('21', 1500)).to.be.false;
    done();
  });

  it('should coalesce lists of intervals', function(done) {
    var ci = (a, b, c) => new ContigInterval(a, b, c);

    var coalesceToString =
        ranges => ContigInterval.coalesce(ranges).map(r => r.toString());

    expect(coalesceToString([
      ci(0, 0, 10),
      ci(0, 10, 20),
      ci(0, 20, 30)
    ])).to.deep.equal([ '0:0-30' ]);

    expect(coalesceToString([
      ci(0, 0, 10),
      ci(0, 5, 20),
      ci(0, 20, 30)
    ])).to.deep.equal([ '0:0-30' ]);

    expect(coalesceToString([
      ci(0, 0, 10),
      ci(0, 5, 19),
      ci(0, 20, 30)  // ContigInterval are inclusive, so these are adjacent
    ])).to.deep.equal([
      '0:0-30'
    ]);

    expect(coalesceToString([
      ci(0, 20, 30),  // unordered
      ci(0, 5, 19),
      ci(0, 0, 10)
    ])).to.deep.equal([
      '0:0-30'
    ]);

    expect(coalesceToString([
      ci(0, 20, 30),
      ci(0, 5, 18),
      ci(0, 0, 10)
    ])).to.deep.equal([
      '0:0-18', '0:20-30'
    ]);

    // ContigInterval.coalesce() shouldn't mutate the input ContigIntervals.
    var ci1 = ci(0, 20, 30),
        ci2 = ci(0, 5, 18),
        ci3 = ci(0, 0, 10);
    expect(coalesceToString([ci1, ci2, ci3])).to.deep.equal([
      '0:0-18', '0:20-30'
    ]);
    expect(ci1.toString()).to.equal('0:20-30');
    expect(ci2.toString()).to.equal('0:5-18');
    expect(ci3.toString()).to.equal('0:0-10');
    done();
  });

  it('should determine coverage', function(done) {
    var iv = new ContigInterval(1, 10, 20);
    expect(iv.isCoveredBy([
      new ContigInterval(1, 0, 10),
      new ContigInterval(1, 5, 15),
      new ContigInterval(1, 10, 20)
    ])).to.be.true;

    expect(iv.isCoveredBy([
      new ContigInterval(1, 0, 13),
      new ContigInterval(1, 11, 15),
      new ContigInterval(1, 16, 30)
    ])).to.be.true;

    expect(iv.isCoveredBy([
      new ContigInterval(1, 0, 10),
      new ContigInterval(1, 5, 15),
      new ContigInterval(1, 17, 30)  // a gap!
    ])).to.be.false;

    expect(iv.isCoveredBy([
      new ContigInterval(0, 0, 13),  // wrong contig
      new ContigInterval(1, 11, 15),
      new ContigInterval(1, 16, 30)
    ])).to.be.false;

    expect(iv.isCoveredBy([
      new ContigInterval(1, 0, 30)
    ])).to.be.true;

    expect(iv.isCoveredBy([
      new ContigInterval(1, 15, 30)
    ])).to.be.false;

    expect(iv.isCoveredBy([
      new ContigInterval(1, 0, 15)
    ])).to.be.false;

    expect(() => iv.isCoveredBy([
      new ContigInterval(1, 5, 15),
      new ContigInterval(1, 0, 10)
    ])).to.throw(/sorted ranges/);

    // Coalescing fixes the sorting problem
    expect(iv.isCoveredBy(ContigInterval.coalesce([
      new ContigInterval(1, 5, 15),
      new ContigInterval(1, 0, 10)
    ]))).to.be.false;
    done();
  });
});
