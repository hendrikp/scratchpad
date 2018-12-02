/** CCD/TDD - test project - Hendrik Polczynski 02.12.2018 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;

namespace SIMS
{
	[TestFixture]
	class IdGeneratorTest
	{
		[Test]
		public void create_an_Id()
		{
			SerialIdGenerator idgen = new SerialIdGenerator();
			Assert.IsNotNull(idgen.GenerateId());
		}

		[Test]
		public void create_a_valid_Id()
		{
			SerialIdGenerator idgen = new SerialIdGenerator();

			Id newId = idgen.GenerateId();

			Assert.IsTrue(newId.IsValid);
		}

		[Test]
		public void An_Id_is_unique()
		{
			SerialIdGenerator idgen = new SerialIdGenerator();

			Id newId1 = idgen.GenerateId();
			Id newId2 = idgen.GenerateId();

			Assert.IsFalse(newId1.Equals(newId2));
		}
		[Test]
		public void An_Id_has_a_HASHCODE()
		{
			SerialIdGenerator idgen = new SerialIdGenerator();

			Id newId1 = idgen.GenerateId();
			
			Assert.IsNotNull(newId1.GetHashCode());
		}
		[Test]
		public void An_Id_has_an_unique_HASHCODE()
		{
			SerialIdGenerator idgen = new SerialIdGenerator();

			Id newId1 = idgen.GenerateId();
			Id newId2 = idgen.GenerateId();

			Assert.IsTrue(newId1.GetHashCode() != newId2.GetHashCode());
		}
	}
}
