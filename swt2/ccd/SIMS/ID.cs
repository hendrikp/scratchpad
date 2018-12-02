/** CCD/TDD - test project - Hendrik Polczynski 02.12.2018 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SIMS
{
	public struct Id : IEquatable<Id>
	{
		private uint _id;
		private static uint _lastID = 0;

		private Id(uint id)
		{
			_id = id;
		}

		public static Id GetNewID()
		{
			return new Id(++_lastID);
		}

		public bool IsValid
		{
			get { return (_id != 0) && (_id <= _lastID); }
		}

		public bool Equals(Id other)
		{
			return this._id == other._id;
		}

		public override bool Equals(object obj)
		{
			if (obj is Id)
				return Equals((Id) obj);

			return false;
		}

		public override int GetHashCode()
		{
			return _id.GetHashCode();
		}

		public override string ToString()
		{
			return string.Format("{0:D8}", _id);
		}
	}

    interface IdGenerator
    {
        Id GenerateId();
    }

	public class SerialIdGenerator : IdGenerator
	{
		public Id GenerateId()
		{
			return Id.GetNewID();
		}
	}
}
