/** CCD/TDD - test project - Hendrik Polczynski 02.12.2018 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SIMS
{
	public class Account
	{
		private ulong _balanceInCent = 0;
		private Id _id;

		private Account()
		{
			throw new NotSupportedException();
		}

		public Account(Id id)
		{
			_id = id;
		}

		public ulong Balance
		{
			get { return _balanceInCent; }
		}

		public Id Id
		{
			get { return _id; }
		}

        public void Withdraw(ulong withdrawalAmount)
        {
            if (withdrawalAmount > _balanceInCent)
                throw new InvalidOperationException();

            _balanceInCent -= withdrawalAmount;
        }

		public void Deposit(uint amount)
		{
			this._balanceInCent += amount;
		}
	}
}
