/** CCD/TDD - test project - Hendrik Polczynski 02.12.2018 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SIMS
{
	public class AccountNotFoundException:Exception
	{ }

	public class CustomerNotFoundException:Exception
	{ }

    public interface AccountManager
    {
        int NumberOfAccounts { get; }
	    Account CreateAccount(Customer customer);
	    Account FindAccount(Id id);
        void DeleteAccount(Id id);
    }

    interface CustomerManager
    {
        int NumberOfCustomers { get; }
        Customer CreateCustomer(string firstName, string lastName);
        Customer FindCustomer(Id id);
    }

	public class Bank : AccountManager, CustomerManager
	{
        IdGenerator _customerIdGenerator = new SerialIdGenerator();
		IdGenerator _accountIdGenerator = new SerialIdGenerator();
        Dictionary<Id, Account> _accounts = new Dictionary<Id, Account>();
        Dictionary<Id, Customer> _customers = new Dictionary<Id, Customer>();

        public int NumberOfAccounts
        {
            get { return _accounts.Count; }
        }

        public int NumberOfCustomers
        {
            get { return _customers.Count; }
        }


		public ulong TotalBalance
		{
			get
			{
				return _accounts.Values.Aggregate<Account, ulong>(0, (current, account) => current + account.Balance);
			}
		}

        public Customer CreateCustomer(string firstName, string lastName)
        {
            var id = _customerIdGenerator.GenerateId();
            var newCustomer = new Customer( id, firstName, lastName);
            _customers.Add(id, newCustomer);

            return newCustomer;
        }

        public Customer FindCustomer( Id id )
        {
            Customer customer;
            if (_customers.TryGetValue(id, out customer))
                return customer;

            throw new CustomerNotFoundException();
        }

		public Account CreateAccount(Customer customer)
		{
			if (customer == null)
				throw new ArgumentNullException("customer");

			var account = new Account(_accountIdGenerator.GenerateId());
			customer.AddAccount(account);
			_accounts[account.Id] = account;

			return account;

		}

		public Account FindAccount(Id id)
		{
			if (!_accounts.ContainsKey(id))
				throw new AccountNotFoundException();

			return _accounts[id];
		}

        public void DeleteAccount(Id id)
        {
            Account account = FindAccount(id);
            if( account.Balance > 0 )
                throw new InvalidOperationException();
            foreach (var customer in _customers.Values)
                customer.RemoveAccount(account);
            _accounts.Remove(id);
        }
    
    }
}
