/** CCD/TDD - test project - Hendrik Polczynski 02.12.2018 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SIMS
{
	public class Customer
	{
        public Id Id { get; private set; }
        public string FirstName { get; private set; }
        public string LastName { get; private set; }

		private LinkedList<Account> _accounts = new LinkedList<Account>(); 

        public IEnumerable<Account> Accounts { get { return _accounts; } }

        internal Customer(Id id, string firstName, string lastName)
        {
            this.Id = id;
			ChangeName(firstName,lastName);
        }

		public void ChangeName(string firstName, string lastName)
		{
			this.FirstName = firstName;
			this.LastName = lastName;
		}

		public void AddAccount(Account acc)
		{
			_accounts.AddLast(acc);
		}
       
        public void RemoveAccount(Account acc)
        {
            _accounts.Remove(acc);
        }
	}
}
